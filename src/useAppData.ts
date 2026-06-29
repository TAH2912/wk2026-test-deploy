import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { baseGroups, baseMatches, baseSquads, baseTeams } from "./data/mappers";
import type { Friend, Match, MatchOverride, PredictionPool } from "./types";
import { mergeMatchOverrides } from "./utils/matches";
import { resolveKnockoutTeams } from "./utils/knockout";
import { fetchAllResults, fetchCommittedResults, type AutoResults } from "./utils/autoResults";
import {
  clearAppStorage,
  loadAutoResults,
  loadAutoSync,
  loadFriends,
  loadLastSynced,
  loadMatchOverrides,
  loadPools,
  saveAutoResults,
  saveAutoSync,
  saveFriends,
  saveLastSynced,
  saveMatchOverrides,
  savePools,
} from "./utils/storage";

/** Hoe lang na de aftrap een wedstrijd nog "actief" is voor het auto-pollen (incl. verlenging/penalty's). */
const ACTIVE_WINDOW_MS = 4 * 60 * 60 * 1000;
const POLL_INTERVAL_MS = 10 * 60 * 1000;

/** Is er een wedstrijd bezig of net afgelopen waarvan we de eindstand nog niet hebben? */
const hasActiveWindow = (matches: Match[], now = Date.now()) =>
  matches.some((match) => {
    if (match.status === "finished" || !match.dateTimeLocal) return false;
    const kickoff = new Date(match.dateTimeLocal).getTime();
    return now >= kickoff && now <= kickoff + ACTIVE_WINDOW_MS;
  });

export const useAppData = () => {
  const [matchOverrides, setMatchOverrides] = useState<Record<string, MatchOverride>>(() => loadMatchOverrides());
  const [friends, setFriends] = useState<Friend[]>(() => loadFriends());
  const [pools, setPools] = useState<PredictionPool[]>(() => loadPools());
  const [autoResults, setAutoResults] = useState<AutoResults>(() => loadAutoResults());
  const [autoSync, setAutoSync] = useState<boolean>(() => loadAutoSync());
  const [lastSynced, setLastSynced] = useState<string | null>(() => loadLastSynced());
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<string>();

  useEffect(() => saveMatchOverrides(matchOverrides), [matchOverrides]);
  useEffect(() => saveFriends(friends), [friends]);
  useEffect(() => savePools(pools), [pools]);
  useEffect(() => saveAutoResults(autoResults), [autoResults]);
  useEffect(() => saveAutoSync(autoSync), [autoSync]);
  useEffect(() => saveLastSynced(lastSynced), [lastSynced]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(undefined), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Lagen: basisdata → automatische uitslagen → handmatige invoer (handmatig wint altijd).
  // Daarna worden knock-out-placeholders (1A, 2B, 3A/B/.., W73, L101) ingevuld met echte teams.
  const matches = useMemo(() => {
    const merged = mergeMatchOverrides(mergeMatchOverrides(baseMatches, autoResults), matchOverrides);
    return resolveKnockoutTeams(merged, baseGroups);
  }, [autoResults, matchOverrides]);

  // Refs zodat de poll-timer altijd de actuele waarden ziet zonder opnieuw op te zetten.
  const autoResultsRef = useRef(autoResults);
  const matchesRef = useRef(matches);
  useEffect(() => {
    autoResultsRef.current = autoResults;
  }, [autoResults]);
  useEffect(() => {
    matchesRef.current = matches;
  }, [matches]);

  const syncResults = useCallback(async (silent = false) => {
    setSyncing(true);
    try {
      const fetched = await fetchAllResults();
      const previous = autoResultsRef.current;
      const added = Object.keys(fetched).filter((id) => !previous[id]).length;
      setAutoResults({ ...previous, ...fetched });
      setLastSynced(new Date().toISOString());
      if (added > 0) setToast(`${added} nieuwe uitslag${added === 1 ? "" : "en"} automatisch verwerkt`);
      else if (!silent) setToast("Uitslagen zijn bijgewerkt");
    } catch {
      if (!silent) setToast("Synchroniseren mislukt — probeer het later opnieuw");
    } finally {
      setSyncing(false);
    }
  }, []);

  // Het meegeleverde vangnet altijd inladen bij opstart (ook als auto-sync uit staat),
  // zodat de bracket compleet is — onafhankelijk van een (mogelijk trage/falende) live-fetch.
  useEffect(() => {
    void (async () => {
      const committed = await fetchCommittedResults();
      if (Object.keys(committed).length > 0) {
        setAutoResults((previous) => ({ ...previous, ...committed }));
      }
    })();
  }, []);

  // Eerste sync bij openen + slim pollen tijdens wedstrijdvensters, zolang auto-sync aanstaat.
  useEffect(() => {
    if (!autoSync) return;
    void syncResults(true);
    const id = window.setInterval(() => {
      if (hasActiveWindow(matchesRef.current)) void syncResults(true);
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [autoSync, syncResults]);

  const updateMatch = (matchId: string, override: MatchOverride) => {
    setMatchOverrides((current) => ({ ...current, [matchId]: { ...(current[matchId] ?? {}), ...override } }));
    setToast("Wedstrijd opgeslagen");
  };

  /** Verwijdert de handmatige invoer voor een wedstrijd → de automatische uitslag telt weer. */
  const removeMatchOverride = (matchId: string) => {
    setMatchOverrides((current) => {
      if (!(matchId in current)) return current;
      const next = { ...current };
      delete next[matchId];
      return next;
    });
    setToast("Teruggezet naar automatische uitslag");
  };

  const toggleAutoSync = (value: boolean) => {
    setAutoSync(value);
    setToast(value ? "Automatisch uitslagen ophalen staat aan" : "Automatisch uitslagen ophalen staat uit");
  };

  const upsertFriend = (friend: Friend) => {
    setFriends((current) => {
      const exists = current.some((item) => item.id === friend.id);
      return exists ? current.map((item) => (item.id === friend.id ? friend : item)) : [...current, friend];
    });
    setToast("Vriend opgeslagen");
  };

  const deleteFriend = (friendId: string) => {
    setFriends((current) => current.filter((friend) => friend.id !== friendId));
    setPools((current) =>
      current.map((pool) => ({ ...pool, predictions: pool.predictions.filter((prediction) => prediction.friendId !== friendId) })),
    );
    setToast("Vriend verwijderd");
  };

  const upsertPool = (pool: PredictionPool) => {
    setPools((current) => {
      const exists = current.some((item) => item.id === pool.id);
      return exists ? current.map((item) => (item.id === pool.id ? pool : item)) : [...current, pool];
    });
    setToast("Pool opgeslagen");
  };

  const resetLocalData = () => {
    clearAppStorage();
    setMatchOverrides({});
    setFriends(loadFriends());
    setPools([]);
    setAutoResults({});
    setAutoSync(true);
    setLastSynced(null);
    setToast("Lokale data gewist");
    void syncResults(true);
  };

  const replaceImportedData = (data: {
    matchOverrides: Record<string, MatchOverride>;
    friends: Friend[];
    pools: PredictionPool[];
  }) => {
    setMatchOverrides(data.matchOverrides);
    setFriends(data.friends);
    setPools(data.pools);
    setToast("Import voltooid");
  };

  return {
    matches,
    teams: baseTeams,
    groups: baseGroups,
    squads: baseSquads,
    matchOverrides,
    autoResults,
    autoSync,
    lastSynced,
    syncing,
    friends,
    pools,
    toast,
    setToast,
    updateMatch,
    removeMatchOverride,
    syncResults,
    toggleAutoSync,
    upsertFriend,
    deleteFriend,
    upsertPool,
    resetLocalData,
    replaceImportedData,
  };
};

export type AppDataContext = ReturnType<typeof useAppData>;
