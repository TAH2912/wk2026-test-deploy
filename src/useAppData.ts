import { useEffect, useMemo, useState } from "react";
import { baseGroups, baseMatches, baseSquads, baseTeams } from "./data/mappers";
import type { Friend, MatchOverride, PredictionPool } from "./types";
import { mergeMatchOverrides } from "./utils/matches";
import {
  clearAppStorage,
  loadFriends,
  loadMatchOverrides,
  loadPools,
  saveFriends,
  saveMatchOverrides,
  savePools,
} from "./utils/storage";

export const useAppData = () => {
  const [matchOverrides, setMatchOverrides] = useState<Record<string, MatchOverride>>(() => loadMatchOverrides());
  const [friends, setFriends] = useState<Friend[]>(() => loadFriends());
  const [pools, setPools] = useState<PredictionPool[]>(() => loadPools());
  const [toast, setToast] = useState<string>();

  useEffect(() => saveMatchOverrides(matchOverrides), [matchOverrides]);
  useEffect(() => saveFriends(friends), [friends]);
  useEffect(() => savePools(pools), [pools]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(undefined), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const matches = useMemo(() => mergeMatchOverrides(baseMatches, matchOverrides), [matchOverrides]);

  const updateMatch = (matchId: string, override: MatchOverride) => {
    setMatchOverrides((current) => ({ ...current, [matchId]: { ...(current[matchId] ?? {}), ...override } }));
    setToast("Wedstrijd opgeslagen");
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
    setToast("Lokale data gewist");
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
    friends,
    pools,
    toast,
    setToast,
    updateMatch,
    upsertFriend,
    deleteFriend,
    upsertPool,
    resetLocalData,
    replaceImportedData,
  };
};

export type AppDataContext = ReturnType<typeof useAppData>;
