import type { Match } from "../types";
import { formatDutchDate, formatDutchTime } from "../utils/date";
import { getMatchWinner, stageLabel, teamDisplayLabel } from "../utils/matches";
import { teamFlag } from "../utils/teams";

const rounds: Match["stage"][] = ["round-of-32", "round-of-16", "quarter-final", "semi-final", "third-place", "final"];

export const KnockoutBracket = ({ matches }: { matches: Match[] }) => (
  <div className="no-scrollbar overflow-x-auto pb-4">
    <div className="grid min-w-[1180px] grid-cols-6 gap-4">
      {rounds.map((round) => {
        const roundMatches = matches.filter((match) => match.stage === round);
        return (
          <section key={round} className="space-y-3">
            <h2 className="sticky top-0 z-10 rounded-xl border border-white/10 bg-stadion-900/90 px-3 py-2 text-sm font-black text-white backdrop-blur">
              {stageLabel(round)}
            </h2>
            <div className={`space-y-3 ${round === "final" ? "pt-24" : round === "semi-final" ? "pt-12" : ""}`}>
              {roundMatches.map((match) => {
                const winner = getMatchWinner(match);
                return (
                  <article key={match.id} className={`relative rounded-2xl border bg-white/[0.04] p-3 ${round === "final" ? "border-oranje-300/50 shadow-glow" : "border-white/10"}`}>
                    <p className="mb-3 text-[11px] font-bold uppercase text-slate-400">
                      {formatDutchDate(match.dateTimeLocal)} · {formatDutchTime(match.dateTimeLocal)}
                    </p>
                    <TeamLine team={match.homeTeam} score={match.homeScore} active={winner === match.homeTeam} />
                    <TeamLine team={match.awayTeam} score={match.awayScore} active={winner === match.awayTeam} />
                    <p className="mt-3 truncate text-xs font-semibold text-slate-500">{match.city}</p>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  </div>
);

const TeamLine = ({ team, score, active }: { team: string; score?: number; active?: boolean }) => (
  <div className={`mb-1 flex items-center justify-between rounded-xl px-3 py-2 ${active ? "bg-oranje-500/20 text-oranje-100" : "bg-black/20 text-slate-100"}`}>
    <span className="flex min-w-0 items-center gap-1.5">
      {teamFlag(team) ? <span className="shrink-0 text-base leading-none">{teamFlag(team)}</span> : null}
      <span className="truncate text-sm font-black">{teamDisplayLabel(team)}</span>
    </span>
    <span className="ml-2 font-black">{score ?? "-"}</span>
  </div>
);
