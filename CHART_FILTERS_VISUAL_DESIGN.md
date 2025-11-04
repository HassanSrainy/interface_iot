# 🎨 ChartFilters Visual Design Preview

## Component Layout

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  ChartFilters Component                                                          │
│  ╔════════════════════════════════════════════════════════════════════════════╗ │
│  ║  🔵 GRADIENT BACKGROUND (blue-50 to indigo-50)                             ║ │
│  ║                                                                             ║ │
│  ║  ⏱️  [Dernière heure ▾]  📅  [Du: __/__/__ Au: __/__/__]                  ║ │
│  ║                                                                             ║ │
│  ║  📈  [Par jour ▾]  🔍  [Filtres avancés !] 🔄 [Réinitialiser]             ║ │
│  ║                                                                             ║ │
│  ║  💙 Clinique A ✖  💚 Service B ✖  💜 Capteur-001 ✖  🧡 Sans aberrantes ✖ ║ │
│  ╚════════════════════════════════════════════════════════════════════════════╝ │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## Time Range Selector
```
┌────────────────────────────────┐
│  ⏱️ Dernière heure            │
│  🕐 6 dernières heures        │
│  📅 24 heures                 │
│  📊 7 derniers jours    ← Selected
│  📈 30 derniers jours         │
│  🗓️ Cette semaine             │
│  📆 Ce mois                   │
│  ⚙️ Personnalisé              │
└────────────────────────────────┘
```

## Custom Date Range Picker
```
┌─────────────────────────────────────────────────────────┐
│  Date début                      Date fin               │
│  ┌──────────────────┐           ┌──────────────────┐   │
│  │  Ma  Je  Ve  Sa  │           │  Ma  Je  Ve  Sa  │   │
│  │  1   2   3   4   │           │  1   2   3   4   │   │
│  │  5   6   7  [8]  │           │  5   6   7  [15] │   │
│  │  9   10  11  12  │           │  9   10  11  12  │   │
│  └──────────────────┘           └──────────────────┘   │
│  ┌──────────────────────────────────────────────────┐  │
│  │  [Annuler]                      [Appliquer]      │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Granularity Selector
```
┌─────────────────────┐
│  Par minute         │
│  Par heure          │
│  Par jour    ← Selected
│  Par semaine        │
│  Par mois           │
└─────────────────────┘
```

## Advanced Filters Popover
```
┌─────────────────────────────────────────┐
│  Filtres avancés      [🔄 Réinitialiser]│
│                                         │
│  Cliniques                              │
│  ┌─────────────────────────────────┐   │
│  │  Toutes les cliniques        ▾  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Services                               │
│  ┌─────────────────────────────────┐   │
│  │  Tous les services           ▾  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Capteurs                               │
│  ┌─────────────────────────────────┐   │
│  │  Tous les capteurs           ▾  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Afficher les valeurs aberrantes  [ON] │
│                                         │
└─────────────────────────────────────────┘
```

## Active Filter Badges
```
Color-coded removable badges that appear when filters are active:

💙 Blue Badge - Clinics
  ┌──────────────┐
  │ Clinique A ✖ │  ← Click X to remove
  └──────────────┘

💚 Green Badge - Services  
  ┌──────────────┐
  │ Service B ✖  │
  └──────────────┘

💜 Purple Badge - Sensors
  ┌─────────────────┐
  │ Capteur-001 ✖   │
  └─────────────────┘

🧡 Orange Badge - Outliers
  ┌──────────────────────────┐
  │ Sans valeurs aberrantes ✖│
  └──────────────────────────┘
```

## Visual States

### Default State (No Active Filters)
```
┌──────────────────────────────────────────────────────────┐
│  ⏱️ [7 derniers jours ▾] 📈 [Par jour ▾] 🔍 [Filtres..] │
└──────────────────────────────────────────────────────────┘
```

### With Active Filters
```
┌──────────────────────────────────────────────────────────────────┐
│  ⏱️ [7 derniers jours ▾] 📈 [Par jour ▾] 🔍 [Filtres avancés !] │
│                                                                  │
│  💙 Clinique A ✖  💜 Capteur-001 ✖                              │
└──────────────────────────────────────────────────────────────────┘
```

### Custom Date Range Active
```
┌──────────────────────────────────────────────────────────────────┐
│  ⏱️ [Personnalisé ▾] 📅 [08 Jan - 15 Jan] 📈 [Par jour ▾]      │
└──────────────────────────────────────────────────────────────────┘
```

## Color Palette

```css
/* Background Gradient */
background: linear-gradient(to right, #eff6ff, #eef2ff);
border: 1px solid #bfdbfe;

/* Icons */
Clock: #2563eb (blue-600)
TrendingUp: #2563eb (blue-600)
Filter: #2563eb (blue-600)

/* Badges */
Clinic Badge:    bg-blue-100,   text-blue-700
Service Badge:   bg-green-100,  text-green-700
Sensor Badge:    bg-purple-100, text-purple-700
Outlier Badge:   bg-orange-100, text-orange-700

/* Buttons */
Reset Button:    ghost variant (transparent with hover)
Apply Button:    default variant (blue)
Cancel Button:   ghost variant
```

## Responsive Behavior

### Desktop (>768px)
- All filters in one horizontal row
- Time range, custom date picker, granularity, advanced filters, reset all visible
- Badges wrap to new line if needed

### Mobile (<768px)  
- Filters stack vertically
- Time range dropdown takes full width
- Custom date picker in popover
- Granularity dropdown below time range
- Advanced filters in popover
- Badges stack vertically

## Interactive Elements

1. **Time Range Dropdown** - Click to open, select option
2. **Custom Date Button** - Click to open dual calendar popover
3. **Granularity Dropdown** - Click to open, select option
4. **Advanced Filters Button** - Click to open popover with entity filters
5. **Filter Badges** - Click X to remove individual filter
6. **Reset Button** - Click to reset all filters to defaults
7. **Calendar** - Click dates to select start/end
8. **Apply/Cancel** - Apply custom date range or cancel

## Smart Features

### Auto-Granularity
```
User selects "Last hour"
  → Granularity auto-changes to "Par minute"

User selects "Last 7 days"
  → Granularity auto-changes to "Par jour"

User selects "Last 30 days"
  → Granularity auto-changes to "Par jour"
```

### Badge Indicator
```
No active entity filters:
  🔍 [Filtres avancés]

With active filters:
  🔍 [Filtres avancés !]  ← Red badge with !
```

### Persistence
```
User changes filters
  ↓
Automatically saved to localStorage
  ↓
Page reload
  ↓
Filters restored automatically
```

## Integration Example

```tsx
// In your dashboard component:

import { ChartFilters } from '@/components/layout/ChartFilters';
import { useChartFilters } from '@/hooks/useChartFilters';

function Dashboard() {
  const {
    filters,
    dateRange,
    setTimeRange,
    setGranularity,
    setDateRange,
    updateFilter,
    resetFilters,
  } = useChartFilters('my-dashboard');

  return (
    <>
      <ChartFilters
        filters={filters}
        onTimeRangeChange={setTimeRange}
        onGranularityChange={setGranularity}
        onDateRangeChange={(start, end) => setDateRange(start, end)}
        onReset={resetFilters}
        showClinicFilter={true}
        showSensorFilter={true}
        showOutlierToggle={true}
        clinics={clinicsData}
        sensors={sensorsData}
        onClinicChange={(ids) => updateFilter('selectedClinics', ids)}
        onSensorChange={(ids) => updateFilter('selectedSensors', ids)}
        onOutlierToggle={(show) => updateFilter('showOutliers', show)}
      />
      
      {/* Your charts here */}
      <MyChart 
        startDate={dateRange.start}
        endDate={dateRange.end}
        granularity={filters.granularity}
      />
    </>
  );
}
```

## Features Summary

✅ 8 time range presets + custom
✅ 5 granularity levels
✅ Smart auto-adjustment
✅ Multi-entity filtering
✅ Outlier toggle
✅ Active filter badges
✅ Individual filter removal
✅ Global reset
✅ LocalStorage persistence
✅ Beautiful gradient design
✅ Icon-enhanced UI
✅ French locale support
✅ Responsive design
✅ TypeScript typed
✅ Configurable visibility
✅ Reusable across app
