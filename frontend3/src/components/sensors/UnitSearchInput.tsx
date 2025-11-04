import { useState, useMemo } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "../ui/utils";
import { Button } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { UNITS } from "../../data/units";

interface UnitSearchInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Composant de recherche d'unité avec Combobox (sans Select classique)
 * Affiche label + symbole dans la recherche
 */
export function UnitSearchInput({ 
  value, 
  onChange, 
  placeholder = "Rechercher une unité..." 
}: UnitSearchInputProps) {
  const [open, setOpen] = useState(false);

  // Grouper les unités par catégorie
  const unitsByCategory = useMemo(() => {
    const grouped: Record<string, typeof UNITS> = {};
    UNITS.forEach((unit) => {
      if (!grouped[unit.category]) {
        grouped[unit.category] = [];
      }
      grouped[unit.category].push(unit);
    });
    return grouped;
  }, []);

  // Trouver l'unité sélectionnée
  const selectedUnit = UNITS.find((unit) => unit.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-9 font-normal"
        >
          {selectedUnit ? (
            <span className="flex items-center gap-2">
              <span>{selectedUnit.label}</span>
              <span className="text-muted-foreground font-mono text-sm">
                {selectedUnit.symbol}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="🔍 Chercher unité, symbole..." />
          <CommandList>
            <CommandEmpty>Aucune unité trouvée.</CommandEmpty>
            {Object.entries(unitsByCategory).map(([category, units]) => (
              <CommandGroup key={category} heading={category}>
                {units.map((unit) => (
                  <CommandItem
                    key={unit.value}
                    value={unit.value}
                    keywords={[unit.label, unit.symbol, unit.category]}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === unit.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex items-center justify-between flex-1">
                      <span>{unit.label}</span>
                      <span className="ml-2 text-muted-foreground font-mono text-sm">
                        {unit.symbol}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
