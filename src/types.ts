export type MatchStatus = "scheduled" | "live" | "finished";

export type Stage =
  | "group"
  | "round-of-32"
  | "round-of-16"
  | "quarter-final"
  | "semi-final"
  | "third-place"
  | "final";

export type Match = {
  id: string;
  num?: number;
  dateTimeUtc?: string;
  dateTimeLocal?: string;
  homeTeam: string;
  awayTeam: string;
  group?: string;
  stage: Stage;
  roundLabel: string;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
  /** Strafschoppen (alleen knock-out bij gelijkspel na de reguliere tijd). */
  homePens?: number;
  awayPens?: number;
  venue?: string;
  city?: string;
  winner?: string;
};

export type Team = {
  id: string;
  name: string;
  normalizedName?: string;
  flag?: string;
  fifaCode?: string;
  group?: string;
  continent?: string;
  confed?: string;
};

export type Group = {
  id: string;
  name: string;
  teams: string[];
};

export type PlayerPosition = "GK" | "DF" | "MF" | "FW";

export type Player = {
  name: string;
  position: PlayerPosition;
  club: string;
  caps: number;
  goals: number;
};

export type Squad = {
  /** Slug voor gebruik in routes/keys, bv. "brazil". */
  id: string;
  team: string;
  confederation?: string;
  group?: string;
  squadSize: number;
  players: Player[];
};

export type Friend = {
  id: string;
  name: string;
  favoriteTeam?: string;
  avatar?: string;
  color?: string;
};

export type Prediction = {
  friendId: string;
  homeScore: number;
  awayScore: number;
  points?: number;
};

export type PredictionPoolStatus = "open" | "closed" | "finished";

export type PredictionPool = {
  id: string;
  matchId: string;
  predictions: Prediction[];
  status: PredictionPoolStatus;
  createdAt: string;
};

export type GroupStandingRow = {
  team: string;
  group: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

export type LeaderboardRow = {
  friend: Friend;
  totalPoints: number;
  predictions: number;
  exactScores: number;
  wonPools: number;
  averagePoints: number;
};

export type MatchOverride = {
  status?: MatchStatus;
  homeScore?: number;
  awayScore?: number;
  winner?: string;
};

export type AppDataExport = {
  version: 1;
  exportedAt: string;
  matchOverrides: Record<string, MatchOverride>;
  friends: Friend[];
  pools: PredictionPool[];
};
