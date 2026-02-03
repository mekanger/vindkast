# Vindapp 🌬️

En moderne webapp for vindsportentusiaster som viser vindmeldinger fra yr.no med aktivitetsanbefalinger.

## Funksjonalitet

### Søk etter steder
- Søk etter steder via yr.no sin lokasjonsdatabase
- Får treff på byer, tettsteder og områder i Norge og internasjonalt
- Viser region og land for hvert søkeresultat

### Vindmelding-dashboard
- Vis vindmelding for flere steder samtidig
- Viser data for de neste 3 dagene
- Fokus på klokkeslettene 10:00, 12:00, 14:00 og 16:00
- Vindstyrke vises med fargekodet badge (grønn/gul/oransje/rød)
- Vindretning vises med pil og grader

### Brukeropplevelse
- Responsivt design som fungerer på mobil og desktop
- Nordisk-inspirert visuelt tema
- Smooth animasjoner og overganger
- Toast-varsler ved handlinger

## Teknisk arkitektur

### Frontend
- **React 18** med TypeScript
- **Tailwind CSS** for styling
- **Shadcn/ui** komponentbibliotek
- **Lucide React** for ikoner

### Backend (Lovable Cloud)
- **Edge Functions** for API-kall mot yr.no
  - `yr-location-search` - Søk etter steder
  - `yr-weather-forecast` - Hent værmelding for koordinater

### API-integrasjoner
- **yr.no Location API** - Søk etter steder og koordinater
- **Met.no Locationforecast API** - Værdata (gratis, åpent API)

## Filstruktur

```
src/
├── components/
│   ├── EmptyState.tsx       # Vises når ingen steder er lagt til
│   ├── LocationCard.tsx     # Viser værmelding for ett sted
│   ├── LocationSearch.tsx   # Søkefelt med autocomplete
│   ├── WindDirectionIcon.tsx # Pil for vindretning
│   └── WindSpeedBadge.tsx   # Fargekodet badge for vindstyrke
├── lib/
│   └── yrApi.ts             # API-klient for yr.no
├── pages/
│   └── Index.tsx            # Hovedside med dashboard
├── types/
│   └── weather.ts           # TypeScript-typer
└── index.css                # Design system og tema

supabase/
└── functions/
    ├── yr-location-search/  # Edge function for stedsøk
    └── yr-weather-forecast/ # Edge function for værdata
```

## Datamodell

### Location
```typescript
interface Location {
  id: string;
  name: string;
  region?: string;
  country?: string;
  coordinates: {
    lat: number;
    lon: number;
  };
}
```

### WindForecast
```typescript
interface WindForecast {
  hour: number;        // 10, 12, 14, eller 16
  windSpeed: number;   // m/s
  windGust: number;    // m/s
  windDirection: number; // grader (0-360)
}
```

### DayForecast
```typescript
interface DayForecast {
  date: string;          // Formatert dato
  forecasts: WindForecast[];
}
```

## Vindstyrke-kategorier

| Kategori | Farge | m/s |
|----------|-------|-----|
| Lett | Grønn | 0-5 |
| Moderat | Gul | 5-10 |
| Sterk | Oransje | 10-15 |
| Ekstrem | Rød | 15+ |

## Kreditering

Værdata fra [yr.no](https://www.yr.no), levert av Meteorologisk institutt og NRK.

---

## Utvikling

### Lokalt oppsett

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm i
npm run dev
```

### Teknologier
- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Lovable Cloud (Supabase)

### Deploy

Åpne [Lovable](https://lovable.dev) og klikk på Share -> Publish.

## Lisens

Dette prosjektet er bygget med [Lovable](https://lovable.dev).
