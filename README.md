# WK 2026 — Wedstrijdcentrum ⚽🇳🇱

Een premium, donker sport-dashboard voor het WK 2026: speelschema, uitslagen, poulestanden,
knock-outbracket en een huiskamerpoule met vrienden. Volledig in het Nederlands, draait 100%
lokaal in de browser (geen backend, geen betaalde API).

Gebouwd met **Vite + React + TypeScript + Tailwind CSS**, met Framer Motion (animaties),
Recharts (grafiek), Lucide (iconen) en React Router (navigatie).

---

## 1. Lokaal draaien

```bash
cd wk2026
npm install      # dependencies installeren (eenmalig)
npm run dev      # dev-server starten → http://localhost:5173/wk2026/
```

> De app draait onder het subpad `/wk2026/` (zie `base` in `vite.config.ts`), zowel lokaal als
> online op GitHub Pages.

## 🌐 Live online

De app staat gepubliceerd op GitHub Pages:

**https://tah2912.github.io/wk2026/**

Deze link werkt op elk apparaat (laptop, tablet, tv, telefoon) en kun je doorsturen naar je vrienden.

> **Let op — data is lokaal per apparaat.** Schema, poules en knock-out zijn voor iedereen
> hetzelfde, maar uitslagen/vrienden/pools die je invoert worden in de browser van dát apparaat
> bewaard (localStorage) en synchroniseren niet automatisch met anderen. Wil je een ingevulde pool
> delen? Gebruik **Instellingen → Export JSON** en laat de ander **Import JSON** doen.

### De live site later bijwerken

Na een wijziging in de code:

```bash
npm run build                       # bouwt opnieuw naar docs/
git add -A && git commit -m "update"
git push                            # GitHub Pages herbouwt automatisch (~1 min)
```

## 2. Builden

```bash
npm run build    # type-check (tsc -b) + productie-build naar dist/
npm run preview  # de gebouwde versie lokaal bekijken
```

De build is type-veilig: `npm run build` faalt bij TypeScript-fouten.

---

## 3. Waar staan de JSON-bestanden?

De drie bronbestanden staan in **`src/data/`**:

```
src/data/
├── worldcup_nl.json       # volledig speelschema (104 wedstrijden, tijden in NL-tijd)
├── worldcup_teams.json    # 48 deelnemende teams (naam, vlag, FIFA-code, groep)
└── worldcup_groups.json   # groepsindeling A t/m L
```

Deze bestanden zijn de **basisdata**. Ze worden bij het bouwen mee-gebundeld (geïmporteerd in
`src/data/mappers.ts`). Wil je later het officiële schema of teams vervangen, overschrijf dan
gewoon deze bestanden (zie §6).

---

## 4. Hoe wordt de JSON naar het interne datamodel gemapt?

Alle vertaling van ruwe JSON → nette TypeScript-types gebeurt in **`src/data/mappers.ts`**.
Zo staat de structuur van de bronbestanden los van de rest van de app.

| Mapperfunctie | Bron | Resultaat |
|---|---|---|
| `mapWorldCupScheduleToMatches()` | `worldcup_nl.json` | `Match[]` |
| `mapWorldCupTeams()` | `worldcup_teams.json` | `Team[]` |
| `mapWorldCupGroups()` | `worldcup_groups.json` | `Group[]` |

Belangrijkste mapping-stappen voor wedstrijden:

- **Tijd**: `"21:00 (NL)"` → `"21:00"`; gecombineerd met de datum tot een ISO-string met
  zomertijd-offset (`2026-06-11T21:00:00+02:00`). Het hele toernooi valt in `Europe/Amsterdam`
  zomertijd (UTC+2), dus sorteren, filteren en countdowns kloppen ongeacht de tijdzone van de kijker.
- **Fase**: `"Matchday 1"` → `group`, `"Round of 32"` → `round-of-32`, … `"Final"` → `final`.
- **Stabiele id**: knock-outwedstrijden krijgen `match-<num>`, groepswedstrijden een id op basis
  van datum/teams. Die id is de sleutel waaronder jouw uitslag in localStorage wordt bewaard.
- **Placeholders**: codes als `1A`, `2B`, `3A/B/C/D/F`, `W73`, `L101` blijven behouden en worden
  in de UI netjes vertaald (`Winnaar groep A`, `Nr. 2 groep B`, `Beste 3e (A/B/C/D/F)`,
  `Winnaar wedstrijd 73`, …) — zie `teamDisplayLabel()` in `src/utils/matches.ts`.

> **Fallback**: ontbreken de bestanden, dan vallen de mappers terug op lege/standaardwaarden en
> blijft de app draaien. Verzin zelf geen fictief schema — de JSON is leidend.

---

## 5. localStorage, reset, export en import

De JSON is read-only basisdata. **Al jouw wijzigingen leven in localStorage** en worden bij
elke aanpassing automatisch opgeslagen (`src/utils/storage.ts`). Sleutels:

| Sleutel | Inhoud |
|---|---|
| `wk2026.matchOverrides` | handmatige uitslagen + statussen per wedstrijd |
| `wk2026.friends` | vrienden (naam, favoriet team, kleur/avatar) |
| `wk2026.pools` | wedstrijdpools + voorspellingen |

De app toont altijd **basisdata samengevoegd met jouw overrides** (`mergeMatchOverrides`). Data
blijft dus staan na een refresh. Alle afgeleide cijfers (poulestanden, beste nummers 3,
poolpunten, klassement, poolwinnaars) worden live herberekend zodra je een uitslag wijzigt.

Op de pagina **Instellingen** (`/settings`):

- **Export JSON** — downloadt al je lokale data als één bestand (`exportAppData()`).
- **Import JSON** — leest zo'n exportbestand terug in (`importAppData()`), met duidelijke
  foutmelding bij ongeldige inhoud.
- **Resetten / Alles wissen** — vraagt eerst om bevestiging, wist daarna alle localStorage en
  bouwt de app opnieuw op vanuit de originele JSON-bestanden.

---

## 6. Later het schema of teams vervangen

1. Vervang het betreffende bestand in `src/data/` (zelfde bestandsnaam).
2. Wijkt de structuur af? Pas alleen de bijbehorende mapperfunctie in `src/data/mappers.ts` aan —
   de rest van de app blijft ongewijzigd werken op de interne types.
3. Worden later echte teams bekend in plaats van placeholders (bv. `1A` → `Nederland`)? Werk dan
   `worldcup_nl.json` bij; de UI pakt het automatisch op.
4. Gebruik in de app **Instellingen → Resetten** om de verse JSON-data te laden (dit wist je oude
   lokale uitslagen). Exporteer eventueel eerst je pools/vrienden en importeer ze daarna terug.

---

## 7. Puntensysteem van de wedstrijdpool

Per voorspelling t.o.v. de echte uitslag (`calculatePredictionPoints`):

| Situatie | Punten |
|---|---|
| Exacte uitslag goed | **5** |
| Juiste winnaar + juist doelsaldo | **3** |
| Juiste winnaar (verkeerd saldo) | **2** |
| Gelijkspel correct voorspeld, verkeerde score | **2** |
| Fout | **0** |

De winnaar van de pool is de deelnemer met de meeste punten (gelijke koplopers delen de winst,
met confetti-celebration). Het vriendenklassement (`/leaderboard`) telt alle pools op en sorteert
op totaalpunten → exacte scores → gewonnen pools → naam.

---

## 8. Projectstructuur

```
src/
├── App.tsx                 # routes + layout
├── main.tsx                # entrypoint (BrowserRouter)
├── types.ts                # alle TypeScript-types
├── useAppData.ts           # centrale state-hook (laadt/bewaart localStorage)
├── data/
│   ├── worldcup_*.json     # bronbestanden
│   └── mappers.ts          # JSON → interne types
├── utils/
│   ├── date.ts             # Nederlandse datum/tijd + countdown
│   ├── standings.ts        # poulestanden + beste nummers 3
│   ├── predictions.ts      # poolpunten + poolwinnaar
│   ├── leaderboard.ts      # vriendenklassement
│   ├── matches.ts          # next match, winnaar, placeholder-labels
│   ├── teams.ts            # team-/vlag-opzoek (uit teams.json)
│   ├── storage.ts          # localStorage + export/import
│   └── exportImport.ts     # re-export van export/import
├── components/             # Navigation, Layout, MatchCard, MatchEditorModal,
│                           # KnockoutBracket, LeaderboardPodium, FriendCard, …
└── pages/                  # Dashboard, Schedule, GroupStandings, Knockout,
                            # PredictionPool, Friends, Leaderboard, Settings
```

## 9. Routes

`/dashboard` · `/schedule` · `/groups` · `/knockout` · `/pool` · `/friends` · `/leaderboard` · `/settings`

Sidebar op desktop, bottom-navigation op tablet/mobiel.

---

Veel kijkplezier tijdens het WK 2026! 🟧
