# Migration vers CustomSelect

## Problème résolu
Le composant Select de shadcn/ui avait des problèmes de couleurs (texte blanc sur fond blanc) à cause de variables CSS globales conflictuelles.

## Solution
Nouveau composant **CustomSelect** avec styles inline garantissant la visibilité du texte.

## Comment migrer

### Avant (ancien Select)
```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

<Select value={filterStatus} onValueChange={(v) => setFilterStatus(v)}>
  <SelectTrigger className="w-40">
    <SelectValue placeholder="Statut" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">Tous</SelectItem>
    <SelectItem value="active">Actif</SelectItem>
    <SelectItem value="inactive">Inactif</SelectItem>
  </SelectContent>
</Select>
```

### Après (nouveau CustomSelect)
```tsx
import { CustomSelect, CustomSelectItem } from '../ui/custom-select';

<CustomSelect 
  value={filterStatus} 
  onValueChange={(v) => setFilterStatus(v)}
  className="w-40"
  placeholder="Statut"
>
  <CustomSelectItem value="all">Tous</CustomSelectItem>
  <CustomSelectItem value="active">Actif</CustomSelectItem>
  <CustomSelectItem value="inactive">Inactif</CustomSelectItem>
</CustomSelect>
```

## Différences clés

1. **Structure simplifiée** : Plus besoin de `SelectTrigger`, `SelectContent`, `SelectValue`
2. **Props déplacées** : `className` et `placeholder` vont directement sur `CustomSelect`
3. **Styles garantis** : Texte noir (#0f172a) sur fond blanc (#ffffff) avec styles inline

## Propriétés disponibles

### CustomSelect
- `value: string` - Valeur sélectionnée
- `onValueChange: (value: string) => void` - Callback de changement
- `children: React.ReactNode` - Les CustomSelectItem
- `placeholder?: string` - Texte par défaut (défaut: "Sélectionner...")
- `className?: string` - Classes Tailwind additionnelles
- `disabled?: boolean` - Désactiver le select

### CustomSelectItem
- `value: string` - Valeur de l'option
- `children: React.ReactNode` - Texte affiché

## Fichiers déjà migrés
- ✅ `sensor-management.tsx` - Tous les Select remplacés

## Fichiers à migrer
- ⏳ `clinique-management.tsx`
- ⏳ `alertes-management.tsx`
- ⏳ `sensor-management-user.tsx`
- ⏳ `alertes-management-user.tsx`
- ⏳ Tous les autres fichiers utilisant Select

## Avantages
- ✅ Texte toujours visible (noir sur blanc)
- ✅ Pas d'impact des variables CSS globales
- ✅ API plus simple
- ✅ Hover et focus clairs (fond bleu clair)
- ✅ Fermeture automatique au clic extérieur
- ✅ Animation de rotation de la flèche
