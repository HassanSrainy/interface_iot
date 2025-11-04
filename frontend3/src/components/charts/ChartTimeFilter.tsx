// src/components/charts/ChartTimeFilter.tsx
import { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar as CalendarComponent } from '../ui/calendar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ChartTimeFilterProps {
  onPeriodChange: (period: string, startDate?: Date, endDate?: Date) => void;
}

const PERIODS = [
  { value: '1h', label: '1 heure' },
  { value: '6h', label: '6 heures' },
  { value: '24h', label: '24 heures' },
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: 'custom', label: 'Personnalisé' },
];

export function ChartTimeFilter({ onPeriodChange }: ChartTimeFilterProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
    if (value !== 'custom') {
      onPeriodChange(value);
    }
  };

  const handleApplyCustomDate = () => {
    if (startDate && endDate) {
      onPeriodChange('custom', startDate, endDate);
      setIsCalendarOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-3 bg-white border rounded-lg p-3 shadow-sm">
      <Clock className="w-4 h-4 text-blue-600" />
      
      <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PERIODS.map(period => (
            <SelectItem key={period.value} value={period.value}>
              {period.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedPeriod === 'custom' && (
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              {startDate && endDate ? (
                <span>
                  {format(startDate, 'dd MMM', { locale: fr })} - {format(endDate, 'dd MMM', { locale: fr })}
                </span>
              ) : (
                <span>Sélectionner les dates</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex gap-2 p-3">
              <div>
                <p className="text-xs font-medium mb-2 text-slate-600">Date début</p>
                <CalendarComponent
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  locale={fr}
                />
              </div>
              <div>
                <p className="text-xs font-medium mb-2 text-slate-600">Date fin</p>
                <CalendarComponent
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  locale={fr}
                />
              </div>
            </div>
            <div className="border-t p-3 flex justify-between">
              <Button variant="ghost" size="sm" onClick={() => setIsCalendarOpen(false)}>
                Annuler
              </Button>
              <Button size="sm" onClick={handleApplyCustomDate} disabled={!startDate || !endDate}>
                Appliquer
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
