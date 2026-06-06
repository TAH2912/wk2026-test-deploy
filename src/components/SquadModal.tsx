import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Shirt, Star, Target, X } from "lucide-react";
import type { Player, Squad } from "../types";
import { teamFlag } from "../utils/teams";
import {
  POSITION_ACCENT,
  POSITION_SHORT,
  getStarPlayers,
  groupByPosition,
  sortPlayers,
  type SquadSortMode,
} from "../utils/squads";

const SORT_OPTIONS: { value: SquadSortMode; label: string }[] = [
  { value: "position", label: "Per positie" },
  { value: "caps", label: "Caps" },
  { value: "goals", label: "Goals" },
];

export const SquadModal = ({ squad, onClose }: { squad: Squad; onClose: () => void }) => {
  const [sort, setSort] = useState<SquadSortMode>("position");
  const { mostCaps, topScorer } = getStarPlayers(squad);
  const flag = teamFlag(squad.team);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const groups = sort === "position" ? groupByPosition(squad.players) : null;
  const flat = sort === "position" ? null : sortPlayers(squad.players, sort);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="glass-strong my-auto w-full max-w-3xl overflow-hidden shadow-card"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-stadion-800 via-stadion-900 to-stadion-950 p-5 md:p-6">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-oranje-500/20 blur-3xl" />
          <button
            className="focus-ring absolute right-4 top-4 rounded-xl p-2 text-slate-300 hover:bg-white/10"
            onClick={onClose}
            aria-label="Sluiten"
          >
            <X size={22} />
          </button>
          <div className="relative flex items-center gap-4">
            <span className="text-5xl leading-none md:text-6xl">{flag || "🏳️"}</span>
            <div>
              <h2 className="font-display text-3xl font-black text-white md:text-4xl">{squad.team}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold">
                {squad.group ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-200">{squad.group}</span>
                ) : null}
                {squad.confederation ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-200">{squad.confederation}</span>
                ) : null}
                <span className="inline-flex items-center gap-1 rounded-full border border-oranje-300/30 bg-oranje-500/15 px-3 py-1 text-oranje-100">
                  <Shirt size={13} /> {squad.squadSize} spelers
                </span>
              </div>
            </div>
          </div>

          {/* Sterspelers */}
          <div className="relative mt-5 grid gap-3 sm:grid-cols-2">
            <StarCard
              icon={<Star size={16} />}
              label="Meeste caps"
              player={mostCaps}
              stat={mostCaps ? `${mostCaps.caps} caps` : "—"}
            />
            <StarCard
              icon={<Target size={16} />}
              label="Topscorer"
              player={topScorer}
              stat={topScorer ? `${topScorer.goals} goals` : "—"}
            />
          </div>
        </div>

        {/* Sorteer-besturing */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Selectie</p>
          <div className="flex rounded-xl border border-white/10 bg-stadion-900 p-1">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setSort(option.value)}
                className={`focus-ring rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  sort === option.value ? "bg-oranje-500 text-white" : "text-slate-300 hover:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Spelers */}
        <div className="max-h-[55vh] overflow-y-auto p-5">
          {groups ? (
            <div className="space-y-6">
              {groups.map((group) => (
                <section key={group.position}>
                  <div className="mb-3 flex items-center gap-2">
                    <span className={`rounded-md border px-2 py-0.5 text-[11px] font-black ${POSITION_ACCENT[group.position]}`}>
                      {POSITION_SHORT[group.position]}
                    </span>
                    <h3 className="text-sm font-black uppercase tracking-wide text-slate-300">{group.label}</h3>
                    <span className="text-xs font-bold text-slate-500">({group.players.length})</span>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-white/10">
                    {group.players.map((player, index) => (
                      <PlayerRow key={`${player.name}-${index}`} player={player} showPosition={false} striped={index % 2 === 1} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-white/10">
              {flat!.map((player, index) => (
                <PlayerRow key={`${player.name}-${index}`} player={player} showPosition striped={index % 2 === 1} rank={index + 1} />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const StarCard = ({
  icon,
  label,
  player,
  stat,
}: {
  icon: ReactNode;
  label: string;
  player?: Player;
  stat: string;
}) => (
  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 p-3">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-oranje-500/20 text-oranje-200">{icon}</span>
    <div className="min-w-0">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-oranje-200">{label}</p>
      <p className="truncate text-base font-black text-white">{player?.name ?? "—"}</p>
      <p className="truncate text-xs font-semibold text-slate-400">{player ? `${player.club} · ${stat}` : stat}</p>
    </div>
  </div>
);

const PlayerRow = ({
  player,
  showPosition,
  striped,
  rank,
}: {
  player: Player;
  showPosition: boolean;
  striped: boolean;
  rank?: number;
}) => (
  <div className={`flex items-center gap-3 px-3 py-2.5 ${striped ? "bg-white/[0.02]" : ""}`}>
    {rank ? <span className="w-5 shrink-0 text-center text-xs font-black text-slate-500">{rank}</span> : null}
    {showPosition ? (
      <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-black ${POSITION_ACCENT[player.position]}`}>
        {POSITION_SHORT[player.position]}
      </span>
    ) : null}
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-bold text-white">{player.name}</p>
      <p className="truncate text-xs font-semibold text-slate-400">{player.club}</p>
    </div>
    <div className="flex shrink-0 items-center gap-4 text-right">
      <div className="w-12">
        <p className="text-sm font-black text-white">{player.caps}</p>
        <p className="text-[10px] font-bold uppercase text-slate-500">caps</p>
      </div>
      <div className="w-12">
        <p className="text-sm font-black text-white">{player.goals}</p>
        <p className="text-[10px] font-bold uppercase text-slate-500">goals</p>
      </div>
    </div>
  </div>
);
