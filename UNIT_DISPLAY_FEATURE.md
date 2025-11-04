# Fonctionnalité d'affichage des unités

## Vue d'ensemble

Le système affiche maintenant les unités de mesure avec des **symboles** (caractères spéciaux) au lieu du texte brut. Au **hover**, un tooltip montre le label complet et la catégorie.

## Bibliothèque d'unités

📁 **Fichier**: `frontend3/src/data/units.ts`

### Structure
```typescript
export interface Unit {
  value: string;      // Valeur stockée en BD (ex: "celsius")
  label: string;      // Nom complet (ex: "Celsius")
  symbol: string;     // Caractère spécial (ex: "°C")
  category: string;   // Catégorie (ex: "Température")
}
```

### 95 unités disponibles réparties en 15 catégories:

| Catégorie | Exemples |
|-----------|----------|
| **Température** | °C, °F, K |
| **Humidité** | %, % RH |
| **Pression** | Pa, bar, psi, atm, mmHg |
| **Distance** | m, cm, mm, km |
| **Vitesse** | m/s, km/h, mph |
| **Luminosité** | lx, lm, cd |
| **Puissance** | W, kW, HP |
| **Électrique** | V, mV, kV, A, mA, Ω, kΩ, MΩ |
| **Débit** | L/s, L/min, m³/h |
| **Volume** | L, mL, m³ |
| **Masse** | g, kg, t |
| **Concentration** | ppm, ppb, mg/L |
| **Chimie** | pH |
| **Son** | dB |
| **Autres** | RPM, Hz |

## Composant UnitDisplay

📁 **Fichier**: `frontend3/src/components/sensors/UnitDisplay.tsx`

### Fonctionnalités
- ✅ Affiche le **symbole** de l'unité (ex: °C au lieu de "celsius")
- ✅ Tooltip au hover montrant le **label complet** et la **catégorie**
- ✅ Configurable (peut désactiver le tooltip)
- ✅ Gère les unités nulles/inexistantes

### Usage
```tsx
import { UnitDisplay } from '../sensors/UnitDisplay';

// Affichage simple avec tooltip
<UnitDisplay value={sensor.unite} />

// Avec classe CSS
<UnitDisplay value={sensor.unite} className="ml-1 text-blue-500" />

// Sans tooltip
<UnitDisplay value={sensor.unite} showTooltip={false} />
```

### Exemple de tooltip
```
Survole: °C
Affiche: 
  Celsius
  Température
```

## Intégration dans l'application

### 1. Gestion des capteurs
- ✅ **sensor-management.tsx** (admin) - Tableaux de capteurs
- ✅ **sensor-management-user.tsx** (user) - Tableaux de capteurs
- Affichage: `25°C` au lieu de `25 celsius`
- Au hover: Montre "Celsius - Température"

### 2. Dashboard
- ✅ **sensor-card.tsx** - Cartes de capteurs
  - Valeur principale avec unité
  - Seuils min/max avec unités
  
- ✅ **sensor-evolution.tsx** - Graphiques d'évolution
  - KPI cards (valeur actuelle, moyenne, min/max)
  - Tooltip du chart avec symboles
  - Labels des seuils dans le graphique
  - Section configuration des seuils
  - Historique des alertes

### 3. Charts Recharts
Dans les tooltips et labels de graphiques:
```typescript
// Tooltip formatter
formatter={(value: number) => {
  const unit = getUnitByValue(capteur.unite);
  const unitSymbol = unit ? unit.symbol : '';
  return [`${value}${unitSymbol}`, 'Valeur'];
}}

// Reference lines
label={{ 
  value: `Seuil max: ${capteur.seuil_max}${getUnitByValue(capteur.unite)?.symbol || ''}` 
}}
```

## Stockage en base de données

### Table `capteurs`
```sql
ALTER TABLE capteurs ADD COLUMN unite VARCHAR(20) NULL;
```

**Valeurs stockées**: Les `value` de la bibliothèque (ex: `"celsius"`, `"percent"`, `"bar"`)

### Seeder intelligent
Le seeder assigne automatiquement les unités selon le type:
- Température → `celsius`
- Humidité → `percent`
- Tension → `volt`
- CO2 → `ppm`
- Autres → unités variées

## Avantages

✅ **UX améliorée**: Symboles universels au lieu de texte
✅ **Tooltips informatifs**: Label complet + catégorie au hover
✅ **Cohérence**: Même affichage partout
✅ **Extensible**: Facile d'ajouter de nouvelles unités
✅ **Charts professionnels**: Symboles dans les graphiques
✅ **Base de données normalisée**: Stockage de valeurs, affichage de symboles

## Test

1. Créer/modifier un capteur avec une unité (ex: `celsius`)
2. La valeur s'affiche: `25°C`
3. Au hover sur `°C`: Tooltip montre "Celsius - Température"
4. Dans le graphique d'évolution: Axe Y et tooltip affichent `°C`
5. Seuils affichent aussi les symboles: "Seuil max: 30°C"

## Fichiers modifiés

### Nouveaux fichiers
- `frontend3/src/components/sensors/UnitDisplay.tsx`

### Fichiers mis à jour
- `frontend3/src/components/sensors/sensor-management.tsx`
- `frontend3/src/components/sensors/sensor-management-user.tsx`
- `frontend3/src/components/dashboard/sensor-card.tsx`
- `frontend3/src/components/dashboard/sensor-evolution.tsx`

### Corrections supplémentaires
- `frontend3/src/components/alertes/alertes-management.tsx` - Fix type "low" → "lower"
- `frontend3/src/components/alertes/alertes-management-user.tsx` - Fix type "low" → "lower"
