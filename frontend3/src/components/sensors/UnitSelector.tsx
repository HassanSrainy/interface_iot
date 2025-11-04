import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { Search } from "lucide-react";
import { UNITS } from "../../data/units";

interface UnitSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function UnitSelector({ value, onChange, placeholder = "Sélectionner une unité" }: UnitSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filtrer les unités selon le terme de recherche
  const filteredUnits = useMemo(() => {
    if (!searchTerm) return UNITS;
    
    const lowerSearch = searchTerm.toLowerCase();
    return UNITS.filter(
      (unit) =>
        unit.label.toLowerCase().includes(lowerSearch) ||
        unit.symbol.toLowerCase().includes(lowerSearch) ||
        unit.category.toLowerCase().includes(lowerSearch) ||
        unit.value.toLowerCase().includes(lowerSearch)
    );
  }, [searchTerm]);

  // Obtenir les catégories des unités filtrées
  const categories = useMemo(() => {
    return Array.from(new Set(filteredUnits.map((unit) => unit.category))).sort();
  }, [filteredUnits]);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder}>
          {value && UNITS.find((u) => u.value === value) ? (
            <span>
              {UNITS.find((u) => u.value === value)?.label}{" "}
              <span className="text-muted-foreground">
                ({UNITS.find((u) => u.value === value)?.symbol})
              </span>
            </span>
          ) : (
            placeholder
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[400px]">
        <div className="sticky top-0 z-10 bg-background p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une unité..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="p-1">
          {categories.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Aucune unité trouvée
            </div>
          ) : (
            categories.map((category) => {
              const categoryUnits = filteredUnits.filter((unit) => unit.category === category);
              return (
                <SelectGroup key={category}>
                  <SelectLabel className="font-semibold text-xs text-muted-foreground px-2 py-1.5">
                    {category}
                  </SelectLabel>
                  {categoryUnits.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      <div className="flex items-center justify-between w-full">
                        <span>{unit.label}</span>
                        <span className="ml-2 text-muted-foreground font-mono text-sm">
                          {unit.symbol}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              );
            })
          )}
        </div>
      </SelectContent>
    </Select>
  );
}
