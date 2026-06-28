import type { Group, Match } from "../types";
import { calculateBestThirdPlacedTeams, calculateGroupStandings } from "./standings";
import { getMatchWinner } from "./matches";
import allocationData from "../data/best_thirds_allocation.json";

const GROUP_POS = /^([12])([A-L])$/;
const BEST_THIRD = /^3([A-L](?:\/[A-L])+)$/;
const WINNER_LOSER = /^([WL])(\d+)$/;
const GROUP_WINNER = /^1[A-L]$/;

/**
 * FIFA's officiële verdeling van de beste nummers 3 (Annex C, alle 495 combinaties).
 * Sleutel = gesorteerde 8 gekwalificeerde groepen; waarde = { winnaar-slot → groepletter van de nr.3 }.
 */
const ALLOCATION = (allocationData as { combinations: Record<string, Record<string, string>> }).combinations;

/** Is dit nog een placeholder-code (1A, 2B, 3A/B/.., W73, L101) i.p.v. een echt team? */
export const isPlaceholderCode = (value: string) =>
  GROUP_POS.test(value) || BEST_THIRD.test(value) || WINNER_LOSER.test(value);

const letterOf = (groupName: string) => groupName.replace(/^Group\s+/i, "").trim();

/**
 * Vult knock-out-placeholders in met echte teams zodra ze bepaalbaar zijn:
 * - 1X/2X uit de poulestand (zodra de groep compleet is),
 * - de 8 beste nummers 3 via de unieke toewijzing,
 * - W##/L## uit de winnaar/verliezer van die wedstrijd.
 * Onbepaalbare plekken behouden hun code (de UI toont dan een net label).
 */
export const resolveKnockoutTeams = (matches: Match[], groups: Group[]): Match[] => {
  const standings = calculateGroupStandings(matches, groups);
  const resolved: Record<string, string> = {};

  const groupIsComplete = (rows: { played: number }[]) =>
    rows.length > 0 && rows.every((row) => row.played === rows.length - 1);

  // 1X / 2X uit de poulestanden
  for (const { group, rows } of standings) {
    if (!groupIsComplete(rows)) continue;
    const letter = letterOf(group);
    if (rows[0]) resolved[`1${letter}`] = rows[0].team;
    if (rows[1]) resolved[`2${letter}`] = rows[1].team;
  }

  // Beste nummers 3 — alleen als álle groepen compleet zijn
  const allGroupsComplete = standings.every(({ rows }) => groupIsComplete(rows));
  if (allGroupsComplete) {
    const thirds = calculateBestThirdPlacedTeams(standings);
    const qualified = thirds.filter((row) => row.rank <= 8);
    if (qualified.length === 8) {
      const key = qualified
        .map((row) => letterOf(row.group))
        .sort()
        .join("");
      const allocation = ALLOCATION[key];
      const thirdTeamByGroup = new Map(qualified.map((row) => [letterOf(row.group), row.team]));

      if (allocation) {
        // Elke "beste nr.3"-wedstrijd: bepaal via de tegenstander (1X-winnaar) welke groep daar speelt.
        for (const match of matches) {
          const thirdCode = [match.homeTeam, match.awayTeam].find((code) => BEST_THIRD.test(code));
          const winnerCode = [match.homeTeam, match.awayTeam].find((code) => GROUP_WINNER.test(code));
          if (!thirdCode || !winnerCode) continue;
          const group = allocation[winnerCode];
          const team = group ? thirdTeamByGroup.get(group) : undefined;
          if (team) resolved[thirdCode] = team;
        }
      }
    }
  }

  const resolveCode = (code: string) => resolved[code] ?? code;

  // W## / L## — oplopend op wedstrijdnummer, zodat eerdere rondes eerst klaar zijn
  const knockout = matches
    .filter((match) => match.stage !== "group" && match.num != null)
    .sort((a, b) => (a.num ?? 0) - (b.num ?? 0));

  for (const match of knockout) {
    const home = resolveCode(match.homeTeam);
    const away = resolveCode(match.awayTeam);
    if (match.status !== "finished" || isPlaceholderCode(home) || isPlaceholderCode(away)) continue;
    const winner = getMatchWinner({ ...match, homeTeam: home, awayTeam: away });
    if (!winner) continue;
    resolved[`W${match.num}`] = winner;
    resolved[`L${match.num}`] = winner === home ? away : home;
  }

  // Verrijk de knock-outwedstrijden met de opgeloste teams
  return matches.map((match) => {
    if (match.stage === "group") return match;
    const homeTeam = resolved[match.homeTeam] ?? match.homeTeam;
    const awayTeam = resolved[match.awayTeam] ?? match.awayTeam;
    if (homeTeam === match.homeTeam && awayTeam === match.awayTeam) return match;
    return { ...match, homeTeam, awayTeam };
  });
};
