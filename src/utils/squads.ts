import type { Player, PlayerPosition, Squad } from "../types";

export const POSITION_ORDER: PlayerPosition[] = ["GK", "DF", "MF", "FW"];

export const POSITION_LABELS: Record<PlayerPosition, string> = {
  GK: "Keepers",
  DF: "Verdedigers",
  MF: "Middenvelders",
  FW: "Aanvallers",
};

export const POSITION_SHORT: Record<PlayerPosition, string> = {
  GK: "KEE",
  DF: "VER",
  MF: "MID",
  FW: "AAN",
};

export const POSITION_ACCENT: Record<PlayerPosition, string> = {
  GK: "text-amber-300 bg-amber-400/10 border-amber-300/30",
  DF: "text-sky-300 bg-sky-400/10 border-sky-300/30",
  MF: "text-emerald-300 bg-emerald-400/10 border-emerald-300/30",
  FW: "text-oranje-300 bg-oranje-400/10 border-oranje-300/30",
};

/** Spelers per positie, in de vaste volgorde GK → DF → MF → FW. */
export const groupByPosition = (players: Player[]) =>
  POSITION_ORDER.map((position) => ({
    position,
    label: POSITION_LABELS[position],
    players: players.filter((player) => player.position === position),
  })).filter((group) => group.players.length > 0);

export type SquadSortMode = "position" | "caps" | "goals";

export const sortPlayers = (players: Player[], mode: SquadSortMode): Player[] => {
  if (mode === "caps") return [...players].sort((a, b) => b.caps - a.caps || a.name.localeCompare(b.name, "nl"));
  if (mode === "goals") return [...players].sort((a, b) => b.goals - a.goals || b.caps - a.caps || a.name.localeCompare(b.name, "nl"));
  return players;
};

/** Meest ervaren speler (caps) en topscorer (goals) van een selectie. */
export const getStarPlayers = (squad: Squad) => {
  if (!squad.players.length) return { mostCaps: undefined, topScorer: undefined };
  const mostCaps = squad.players.reduce((best, p) => (p.caps > best.caps ? p : best), squad.players[0]);
  const topScorer = squad.players.reduce((best, p) => (p.goals > best.goals ? p : best), squad.players[0]);
  return { mostCaps, topScorer };
};

export const buildSquadIndex = (squads: Squad[]) => {
  const index = new Map<string, Squad>();
  squads.forEach((squad) => index.set(squad.team.toLowerCase(), squad));
  return index;
};
