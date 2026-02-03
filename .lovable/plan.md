
## Endring av antall dager vist fra kl. 19:00

### Nåværende oppførsel
- Fra kl. 00:00-18:59: Viser 3 dager (i dag, i morgen, overmorgen)
- Fra kl. 19:00-23:59: Viser 3 dager (i morgen, overmorgen, dagen etter)

### Ønsket oppførsel
- Fra kl. 00:00-18:59: Viser 3 dager (i dag, i morgen, overmorgen)
- Fra kl. 19:00-23:59: Viser **2 dager** (i morgen, overmorgen)

---

### Teknisk endring

**Fil:** `src/pages/Index.tsx`

Endring i `dayDates`-beregningen (linje 163-182):

```typescript
// Nåværende kode:
const startOffset = currentHour >= 19 ? 1 : 0;

for (let i = startOffset; i < startOffset + 3; i++) {
  // ...
}

// Ny kode:
const startOffset = currentHour >= 19 ? 1 : 0;
const numDays = currentHour >= 19 ? 2 : 3;

for (let i = startOffset; i < startOffset + numDays; i++) {
  // ...
}
```

### Oppsummering
- Legger til en `numDays`-variabel som er **2** fra kl. 19:00 og **3** ellers
- Bruker denne i løkken for å bestemme hvor mange dager som skal vises
- Kommentaren oppdateres for å reflektere ny oppførsel
