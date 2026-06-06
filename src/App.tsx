import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { FriendsPage } from "./pages/FriendsPage";
import { GroupStandingsPage } from "./pages/GroupStandingsPage";
import { KnockoutPage } from "./pages/KnockoutPage";
import { CountriesPage } from "./pages/CountriesPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { PredictionPoolPage } from "./pages/PredictionPoolPage";
import { SchedulePage } from "./pages/SchedulePage";
import { SettingsPage } from "./pages/SettingsPage";
import { useAppData } from "./useAppData";

export const App = () => {
  const data = useAppData();

  return (
    <Layout toast={data.toast}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage data={data} />} />
        <Route path="/schedule" element={<SchedulePage data={data} />} />
        <Route path="/groups" element={<GroupStandingsPage data={data} />} />
        <Route path="/knockout" element={<KnockoutPage data={data} />} />
        <Route path="/countries" element={<CountriesPage data={data} />} />
        <Route path="/pool" element={<PredictionPoolPage data={data} />} />
        <Route path="/friends" element={<FriendsPage data={data} />} />
        <Route path="/leaderboard" element={<LeaderboardPage data={data} />} />
        <Route path="/settings" element={<SettingsPage data={data} />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
};
