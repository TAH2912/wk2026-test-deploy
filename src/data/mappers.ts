import scheduleData from "./worldcup_nl.json";
import teamsData from "./worldcup_teams.json";
import groupsData from "./worldcup_groups.json";
import squadsData from "./worldcup_squads.json";
import type { Group, Match, Player, PlayerPosition, Squad, Stage, Team } from "../types";
import { parseDutchDateTimeToDate } from "../utils/date";

type RawMatch = {
  round?: string;
  num?: number;
  date?: string;
  time?: string;
  team1?: string;
  team2?: string;
  group?: string;
  ground?: string;
  venue?: string;
  city?: string;
};

type RawTeam = {
  name?: string;
  name_normalised?: string;
  flag_icon?: string;
  fifa_code?: string;
  group?: string;
  continent?: string;
  confed?: string;
};

type RawGroup = {
  group?: string;
  teams?: Array<{ team?: string } | string>;
};

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const getStage = (raw: RawMatch): Stage => {
  const round = (raw.round ?? "").toLowerCase();
  if (raw.group || round.startsWith("matchday")) return "group";
  if (round.includes("32")) return "round-of-32";
  if (round.includes("16")) return "round-of-16";
  if (round.includes("quarter")) return "quarter-final";
  if (round.includes("semi")) return "semi-final";
  if (round.includes("third")) return "third-place";
  if (round.includes("final")) return "final";
  return "group";
};

const cleanTime = (time?: string) => (time ?? "00:00").replace(/\s*\(NL\)\s*/i, "");

// Finale en troostfinale hebben in de bron geen nummer, maar OpenFootball kent ze als 103/104.
// Door ze hetzelfde nummer te geven, kunnen hun uitslagen ook automatisch worden opgehaald.
const inferNum = (raw: RawMatch): number | undefined => {
  if (raw.num != null) return raw.num;
  const round = (raw.round ?? "").toLowerCase();
  if (round.includes("third")) return 103;
  if (round.includes("final")) return 104;
  return undefined;
};

export const mapWorldCupScheduleToMatches = (input: unknown = scheduleData): Match[] => {
  const matches = (input as { matches?: RawMatch[] }).matches ?? [];

  return matches
    .map((raw, index) => {
      const date = raw.date ?? "2026-06-11";
      const time = cleanTime(raw.time);
      const parsed = parseDutchDateTimeToDate(date, time);
      const roundLabel = raw.round ?? (raw.group ? "Groepsfase" : "Wedstrijd");
      const num = inferNum(raw);
      const id = num ? `match-${num}` : `match-${index + 1}-${slug(`${date}-${time}-${raw.team1}-${raw.team2}`)}`;

      return {
        id,
        num,
        dateTimeLocal: parsed.toISOString(),
        homeTeam: raw.team1 ?? "Onbekend",
        awayTeam: raw.team2 ?? "Onbekend",
        group: raw.group,
        stage: getStage(raw),
        roundLabel,
        status: "scheduled",
        venue: raw.venue,
        city: raw.city ?? raw.ground,
      } satisfies Match;
    })
    .sort((a, b) => new Date(a.dateTimeLocal ?? 0).getTime() - new Date(b.dateTimeLocal ?? 0).getTime());
};

export const mapWorldCupTeams = (input: unknown = teamsData): Team[] => {
  const teams = Array.isArray(input) ? (input as RawTeam[]) : [];
  return teams.map((team) => ({
    id: slug(team.name ?? crypto.randomUUID()),
    name: team.name ?? "Onbekend team",
    normalizedName: team.name_normalised,
    flag: team.flag_icon,
    fifaCode: team.fifa_code,
    group: team.group,
    continent: team.continent,
    confed: team.confed,
  }));
};

export const mapWorldCupGroups = (input: unknown = groupsData): Group[] => {
  const groups = (input as { groups?: RawGroup[] }).groups ?? [];
  return groups.map((group) => {
    const name = group.group ?? "Group ?";
    return {
      id: name.replace("Group ", ""),
      name,
      teams: (group.teams ?? []).map((team) => (typeof team === "string" ? team : team.team ?? "Onbekend team")),
    };
  });
};

type RawPlayer = {
  name?: string;
  position?: string;
  club?: string;
  caps?: number;
  goals?: number;
};

type RawSquad = {
  team?: string;
  confederation?: string;
  group?: string;
  squad_size?: number;
  players?: RawPlayer[];
};

const POSITIONS: PlayerPosition[] = ["GK", "DF", "MF", "FW"];

const normalizePosition = (value?: string): PlayerPosition => {
  const upper = (value ?? "").toUpperCase();
  return (POSITIONS as string[]).includes(upper) ? (upper as PlayerPosition) : "MF";
};

export const mapWorldCupSquads = (input: unknown = squadsData): Squad[] => {
  const teams = (input as { teams?: RawSquad[] }).teams ?? [];
  return teams.map((squad) => {
    const players: Player[] = (squad.players ?? []).map((player) => ({
      name: player.name ?? "Onbekende speler",
      position: normalizePosition(player.position),
      club: player.club ?? "Onbekende club",
      caps: typeof player.caps === "number" ? player.caps : 0,
      goals: typeof player.goals === "number" ? player.goals : 0,
    }));
    const team = squad.team ?? "Onbekend team";
    return {
      id: slug(team),
      team,
      confederation: squad.confederation,
      group: squad.group,
      squadSize: squad.squad_size ?? players.length,
      players,
    };
  });
};

export const baseMatches = mapWorldCupScheduleToMatches();
export const baseTeams = mapWorldCupTeams();
export const baseGroups = mapWorldCupGroups();
export const baseSquads = mapWorldCupSquads();
