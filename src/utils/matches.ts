import type { Match } from "../types";

const placeholderPattern = /^(W|L)\d+$|^\d[A-L](\/[A-L])*$|winner|runner-up|third|best/i;

export const isPlaceholderTeam = (team: string) => placeholderPattern.test(team);

/** Zet brontaal-placeholders ("1A", "2B", "3A/B/C/D/F", "W73", "L101") om naar nette NL-labels. */
export const teamDisplayLabel = (team: string): string => {
  const groupPos = team.match(/^(\d)([A-L])$/);
  if (groupPos) {
    const [, pos, group] = groupPos;
    if (pos === "1") return `Winnaar groep ${group}`;
    if (pos === "2") return `Nr. 2 groep ${group}`;
    return `Nr. ${pos} groep ${group}`;
  }
  const bestThird = team.match(/^3([A-L](?:\/[A-L])+)$/);
  if (bestThird) return `Beste 3e (${bestThird[1]})`;
  const winner = team.match(/^W(\d+)$/i);
  if (winner) return `Winnaar wedstrijd ${winner[1]}`;
  const loser = team.match(/^L(\d+)$/i);
  if (loser) return `Verliezer wedstrijd ${loser[1]}`;
  return team;
};

export const getMatchWinner = (match: Match) => {
  if (match.winner) return match.winner;
  if (match.homeScore === undefined || match.awayScore === undefined) return undefined;
  if (match.homeScore > match.awayScore) return match.homeTeam;
  if (match.awayScore > match.homeScore) return match.awayTeam;
  // Gelijkspel → beslist op strafschoppen (knock-out).
  if (match.homePens != null && match.awayPens != null) {
    if (match.homePens > match.awayPens) return match.homeTeam;
    if (match.awayPens > match.homePens) return match.awayTeam;
  }
  return undefined;
};

export const mergeMatchOverrides = <T extends Match>(matches: T[], overrides: Record<string, Partial<Match>>): T[] =>
  matches.map((match) => ({ ...match, ...(overrides[match.id] ?? {}) }));

export const getNextMatch = (matches: Match[]) => {
  const now = Date.now();
  return [...matches]
    .filter((match) => match.status !== "finished" && (match.dateTimeLocal ? new Date(match.dateTimeLocal).getTime() >= now : true))
    .sort((a, b) => new Date(a.dateTimeLocal ?? 0).getTime() - new Date(b.dateTimeLocal ?? 0).getTime())[0];
};

export const getNextNetherlandsMatch = (matches: Match[]) => {
  const now = Date.now();
  return [...matches]
    .filter(
      (match) =>
        match.status !== "finished" &&
        (match.homeTeam.toLowerCase().includes("netherlands") ||
          match.awayTeam.toLowerCase().includes("netherlands") ||
          match.homeTeam.toLowerCase().includes("nederland") ||
          match.awayTeam.toLowerCase().includes("nederland")) &&
        (match.dateTimeLocal ? new Date(match.dateTimeLocal).getTime() >= now : true),
    )
    .sort((a, b) => new Date(a.dateTimeLocal ?? 0).getTime() - new Date(b.dateTimeLocal ?? 0).getTime())[0];
};

export const stageLabel = (stage: Match["stage"]) => {
  const labels: Record<Match["stage"], string> = {
    group: "Poulefase",
    "round-of-32": "Ronde van 32",
    "round-of-16": "Achtste finales",
    "quarter-final": "Kwartfinale",
    "semi-final": "Halve finale",
    "third-place": "Troostfinale",
    final: "Finale",
  };
  return labels[stage];
};
