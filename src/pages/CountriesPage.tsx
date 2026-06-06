import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Shirt, Users } from "lucide-react";
import type { AppDataContext } from "../useAppData";
import type { Squad } from "../types";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { SquadModal } from "../components/SquadModal";
import { teamFlag } from "../utils/teams";

export const CountriesPage = ({ data }: { data: AppDataContext }) => {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");
  const [selected, setSelected] = useState<Squad | null>(null);

  const groups = useMemo(
    () => Array.from(new Set(data.squads.map((s) => s.group).filter(Boolean))) as string[],
    [data.squads],
  );

  const countries = useMemo(() => {
    const term = query.trim().toLowerCase();
    return [...data.squads]
      .filter((squad) => (group === "all" ? true : squad.group === group))
      .filter((squad) => (term ? squad.team.toLowerCase().includes(term) : true))
      .sort((a, b) => a.team.localeCompare(b.team, "nl"));
  }, [data.squads, query, group]);

  return (
    <div>
      <PageHeader
        label="Landen & Selecties"
        title="Alle 48 deelnemers"
        body="Bekijk de volledige selectie van elk land. Klik op een land voor alle spelers met positie, club, caps en goals."
      />

      {/* Filterbalk */}
      <div className="sticky top-0 z-20 -mx-4 mb-6 bg-stadion-950/80 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:px-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Zoek een land"
              className="focus-ring w-full rounded-xl border border-white/10 bg-stadion-900 py-3 pl-10 pr-4 text-sm font-semibold text-white placeholder:text-slate-500"
            />
          </div>
          <select
            value={group}
            onChange={(event) => setGroup(event.target.value)}
            className="focus-ring rounded-xl border border-white/10 bg-stadion-900 px-4 py-3 text-sm font-bold text-white"
          >
            <option value="all">Alle poules</option>
            {groups.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      {countries.length ? (
        <motion.div layout className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {countries.map((squad) => (
            <CountryCard key={squad.id} squad={squad} onOpen={() => setSelected(squad)} />
          ))}
        </motion.div>
      ) : (
        <EmptyState title="Geen land gevonden" body="Pas je zoekopdracht of poulefilter aan om landen te tonen." />
      )}

      <AnimatePresence>
        {selected ? <SquadModal key={selected.id} squad={selected} onClose={() => setSelected(null)} /> : null}
      </AnimatePresence>
    </div>
  );
};

const CountryCard = ({ squad, onOpen }: { squad: Squad; onOpen: () => void }) => {
  const flag = teamFlag(squad.team);
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onClick={onOpen}
      className="glass card-hover group flex flex-col items-start p-4 text-left"
    >
      <div className="flex w-full items-start justify-between gap-2">
        <span className="text-4xl leading-none transition-transform group-hover:scale-110">{flag || "🏳️"}</span>
        {squad.group ? (
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-black text-slate-300">
            {squad.group.replace("Group ", "Groep ")}
          </span>
        ) : null}
      </div>
      <h3 className="mt-3 line-clamp-2 text-base font-black text-white">{squad.team}</h3>
      <div className="mt-2 flex items-center gap-3 text-xs font-bold text-slate-400">
        <span className="inline-flex items-center gap-1"><Shirt size={13} className="text-oranje-300" />{squad.squadSize}</span>
        {squad.confederation ? <span className="inline-flex items-center gap-1"><Users size={13} />{squad.confederation}</span> : null}
      </div>
    </motion.button>
  );
};
