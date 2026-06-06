import { BarChart3, CalendarDays, Flag, Home, Medal, Settings, Shield, Swords, Trophy, Users } from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/dashboard", label: "Dashboard", short: "Home", icon: Home },
  { to: "/schedule", label: "Speelschema", short: "Schema", icon: CalendarDays },
  { to: "/groups", label: "Poules", short: "Poules", icon: BarChart3 },
  { to: "/knockout", label: "Knock-out", short: "Knock-out", icon: Swords },
  { to: "/countries", label: "Landen & Selecties", short: "Landen", icon: Flag },
  { to: "/pool", label: "Pool", short: "Pool", icon: Trophy },
  { to: "/friends", label: "Vrienden", short: "Vrienden", icon: Users },
  { to: "/leaderboard", label: "Klassement", short: "Klassem.", icon: Medal },
  { to: "/settings", label: "Instellingen", short: "Meer", icon: Settings },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition ${
    isActive ? "bg-oranje-500 text-white shadow-glow" : "text-slate-300 hover:bg-white/10 hover:text-white"
  }`;

export const Navigation = () => (
  <>
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/10 bg-stadion-950/85 p-5 backdrop-blur-xl lg:block">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-oranje-500 text-white shadow-glow">
          <Shield size={26} />
        </div>
        <div>
          <p className="font-display text-xl font-black text-white">WK 2026</p>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-oranje-200">Oranje center</p>
        </div>
      </div>
      <nav className="space-y-2">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} className={linkClass}>
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-stadion-950/90 px-2 py-2 backdrop-blur-xl lg:hidden">
      <div className="grid grid-cols-9 gap-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex min-h-14 flex-col items-center justify-center rounded-xl text-[10px] font-bold transition ${
                isActive ? "bg-oranje-500 text-white" : "text-slate-400"
              }`
            }
          >
            <item.icon size={19} />
            <span className="mt-1 hidden sm:block">{item.short}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  </>
);
