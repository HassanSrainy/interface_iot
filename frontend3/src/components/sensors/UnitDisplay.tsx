import React from 'react';
import { getUnitByValue } from '../../data/units';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

interface UnitDisplayProps {
  value: string | null | undefined;
  className?: string;
  showTooltip?: boolean;
}

/**
 * Affiche le symbole d'une unité avec tooltip au hover montrant le label complet
 * Exemple: affiche "°C" et au hover montre "Celsius"
 */
export function UnitDisplay({ value, className = '', showTooltip = true }: UnitDisplayProps) {
  if (!value) return null;

  const unit = getUnitByValue(value);
  if (!unit) return <span className={className}>{value}</span>;

  if (!showTooltip) {
    return <span className={className}>{unit.symbol}</span>;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`cursor-help ${className}`}>
            {unit.symbol}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{unit.label}</p>
          <p className="text-xs text-muted-foreground">{unit.category}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default UnitDisplay;
