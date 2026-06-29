import type { MatchStatus } from "../types";
import { baseMatches } from "../data/mappers";

/** Publieke, key-loze en CORS-vriendelijke bron met dezelfde structuur/teamnamen als onze data. */
export const OPENFOOTBALL_URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

/** Vangnet-bestand dat de GitHub Action periodiek bijwerkt (zelfde formaat als OpenFootball). */
export const COMMITTED_RESULTS_URL = `${import.meta.env.BASE_URL}results.json`;

type RawOpenFootballMatch = {
  round?: string;
  num?: number;
  date?: string;
  time?: string;
  team1?: string;
  team2?: string;
  group?: string;
  ground?: string;
  score?: { ft?: number[]; ht?: number[]; pen?: number[]; p?: number[] };
  score1?: number;
  score2?: number;
};

type RawOpenFootballFile = { matches?: RawOpenFootballMatch[] };

/** Eén automatisch opgehaalde eindstand, gekoppeld aan een wedstrijd-id uit onze app. */
export type AutoResult = {
  homeScore: number;
  awayScore: number;
  status: Extract<MatchStatus, "finished">;
  /** Strafschoppen, indien het duel daarop is beslist. */
  homePens?: number;
  awayPens?: number;
};

export type AutoResults = Record<string, AutoResult>;

/* ------------------------------------------------------------------ */
/* Koppeling: OpenFootball-wedstrijd → onze match.id                   */
/* ------------------------------------------------------------------ */

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "");

const pairKey = (team1: string, team2: string) => `${normalize(team1)}__${normalize(team2)}`;

/**
 * Index over onze basiswedstrijden:
 * - knock-out koppelen we op `num` (identiek genummerd in beide bronnen),
 * - groepswedstrijden op het (geordende) teampaar — uniek binnen de groepsfase.
 * Bewust NIET op datum: OpenFootball gebruikt lokale venue-tijd, wij Nederlandse tijd.
 */
const buildBaseIndex = () => {
  const byNum = new Map<number, string>();
  const byPair = new Map<string, string>();
  for (const match of baseMatches) {
    if (match.num != null) byNum.set(match.num, match.id);
    if (match.stage === "group") byPair.set(pairKey(match.homeTeam, match.awayTeam), match.id);
  }
  return { byNum, byPair };
};

const { byNum, byPair } = buildBaseIndex();

const asPair = (value?: number[]): [number, number] | null =>
  Array.isArray(value) && value.length === 2 && typeof value[0] === "number" && typeof value[1] === "number"
    ? [value[0], value[1]]
    : null;

const extractFullTime = (raw: RawOpenFootballMatch): [number, number] | null =>
  asPair(raw.score?.ft) ??
  (typeof raw.score1 === "number" && typeof raw.score2 === "number" ? [raw.score1, raw.score2] : null);

const extractPens = (raw: RawOpenFootballMatch): [number, number] | null =>
  asPair(raw.score?.pen) ?? asPair(raw.score?.p);

/** Bouwt een AutoResult; bij `swap` worden score én strafschoppen omgedraaid. */
const buildResult = (ft: [number, number], pens: [number, number] | null, swap: boolean): AutoResult => {
  const [home, away] = swap ? [ft[1], ft[0]] : ft;
  const result: AutoResult = { homeScore: home, awayScore: away, status: "finished" };
  if (pens) {
    result.homePens = swap ? pens[1] : pens[0];
    result.awayPens = swap ? pens[0] : pens[1];
  }
  return result;
};

/** Zet een OpenFootball-bestand om naar { onze-match-id → eindstand }. Alleen wedstrijden met een eindstand. */
export const parseOpenFootball = (data: unknown): AutoResults => {
  const matches = (data as RawOpenFootballFile)?.matches ?? [];
  const out: AutoResults = {};

  for (const raw of matches) {
    const ft = extractFullTime(raw);
    if (!ft) continue;
    const pens = extractPens(raw);

    if (raw.num != null) {
      const id = byNum.get(raw.num);
      if (id) out[id] = buildResult(ft, pens, false);
      continue;
    }

    if (raw.team1 && raw.team2) {
      const direct = byPair.get(pairKey(raw.team1, raw.team2));
      if (direct) {
        out[direct] = buildResult(ft, pens, false);
        continue;
      }
      const swapped = byPair.get(pairKey(raw.team2, raw.team1));
      if (swapped) {
        out[swapped] = buildResult(ft, pens, true); // teams omgekeerd → alles meedraaien
      }
    }
  }

  return out;
};

const fetchJson = async (url: string): Promise<unknown> => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Verzoek mislukt (${res.status}) voor ${url}`);
  return res.json();
};

/** Verse uitslagen rechtstreeks uit OpenFootball (CORS-ok, geen key). */
export const fetchOpenFootballResults = async (): Promise<AutoResults> => {
  return parseOpenFootball(await fetchJson(OPENFOOTBALL_URL));
};

/** Uitslagen uit het meegeleverde vangnet-bestand (door de GitHub Action bijgewerkt). */
export const fetchCommittedResults = async (): Promise<AutoResults> => {
  try {
    return parseOpenFootball(await fetchJson(COMMITTED_RESULTS_URL));
  } catch {
    return {};
  }
};

/**
 * Haalt beide bronnen op: eerst het vangnet (snel, zelfde origin), daarna de live bron (verst).
 * Live-resultaten overschrijven het vangnet. Faalt live, dan blijft het vangnet staan.
 */
export const fetchAllResults = async (): Promise<AutoResults> => {
  const committed = await fetchCommittedResults();
  try {
    const live = await fetchOpenFootballResults();
    return { ...committed, ...live };
  } catch {
    return committed;
  }
};
