// src/components/layout/ChartFilters.tsx
import { useState } from 'react';
import { Calendar, Clock, Filter, RotateCcw, TrendingUp, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Label } from '../ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar as CalendarComponent } from '../ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ChartFilterOptions, TimeRange, ChartGranularity } from '../../hooks/useChartFilters';

interface ChartFiltersProps {
  filters: ChartFilterOptions;
  onTimeRangeChange: (range: TimeRange) => void;
  onGranularityChange: (granularity: ChartGranularity) => void;
  onDateRangeChange: (start: Date | null, end: Date | null) => void;
  onReset: () => void;
  showClinicFilter?: boolean;
  showServiceFilter?: boolean;
  showSensorFilter?: boolean;
  showOutlierToggle?: boolean;
  clinics?: { id: number; nom: string }[];
  services?: { id: number; nom: string }[];
  sensors?: { id: number; matricule: string }[];
  onClinicChange?: (ids: number[]) => void;
  onServiceChange?: (ids: number[]) => void;
  onSensorChange?: (ids: number[]) => void;
  onOutlierToggle?: (show: boolean) => void;
}

const TIME_RANGES: { value: TimeRange; label: string; icon: string }[] = [
  { value: 'last-hour', label: 'Dernière heure', icon: '⏱️' },
  { value: 'last-6-hours', label: '6 dernières heures', icon: '🕐' },
  { value: 'last-24-hours', label: '24 heures', icon: '📅' },
  { value: 'last-7-days', label: '7 derniers jours', icon: '📊' },
  { value: 'last-30-days', label: '30 derniers jours', icon: '📈' },
  { value: 'this-week', label: 'Cette semaine', icon: '🗓️' },
  { value: 'this-month', label: 'Ce mois', icon: '📆' },
  { value: 'custom', label: 'Personnalisé', icon: '⚙️' },
];

const GRANULARITIES: { value: ChartGranularity; label: string }[] = [
  { value: 'minute', label: 'Par minute' },
  { value: 'hour', label: 'Par heure' },
  { value: 'day', label: 'Par jour' },
  { value: 'week', label: 'Par semaine' },
  { value: 'month', label: 'Par mois' },
];

export function ChartFilters({
  filters,
  onTimeRangeChange,
  onGranularityChange,
  onDateRangeChange,
  onReset,
  showClinicFilter = false,
  showServiceFilter = false,
  showSensorFilter = false,
  showOutlierToggle = false,
  clinics = [],
  services = [],
  sensors = [],
  onClinicChange,
  onServiceChange,
  onSensorChange,
  onOutlierToggle,
}: ChartFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(filters.startDate || undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(filters.endDate || undefined);

  const hasActiveFilters = 
    filters.selectedClinics.length > 0 ||
    filters.selectedServices.length > 0 ||
    filters.selectedSensors.length > 0 ||
    !filters.showOutliers;

  const handleApplyCustomRange = () => {
    if (startDate && endDate) {
      onDateRangeChange(startDate, endDate);
      setIsOpen(false);
    }
  };

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Time Range Quick Select */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <Select value={filters.timeRange} onValueChange={onTimeRangeChange}>
              <SelectTrigger className="w-[200px] bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_RANGES.map(range => (
                  <SelectItem key={range.value} value={range.value}>
                    <span className="flex items-center gap-2">
                      <span>{range.icon}</span>
                      <span>{range.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range Picker */}
          {filters.timeRange === 'custom' && (
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white">
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
                    <Label className="text-xs mb-2">Date début</Label>
                    <CalendarComponent
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      locale={fr}
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-2">Date fin</Label>
                    <CalendarComponent
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      locale={fr}
                    />
                  </div>
                </div>
                <div className="border-t p-3 flex justify-between">
                  <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                    Annuler
                  </Button>
                  <Button size="sm" onClick={handleApplyCustomRange} disabled={!startDate || !endDate}>
                    Appliquer
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Granularity Select */}
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <Select value={filters.granularity} onValueChange={onGranularityChange}>
              <SelectTrigger className="w-[150px] bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GRANULARITIES.map(gran => (
                  <SelectItem key={gran.value} value={gran.value}>
                    {gran.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Filters Popover */}
          {(showClinicFilter || showServiceFilter || showSensorFilter || showOutlierToggle) && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white relative">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtres avancés
                  {hasActiveFilters && (
                    <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                      !
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Filtres avancés</h4>
                    <Button variant="ghost" size="sm" onClick={onReset}>
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Réinitialiser
                    </Button>
                  </div>

                  {showClinicFilter && clinics.length > 0 && (
                    <div>
                      <Label className="text-xs text-slate-600">Cliniques</Label>
                      <Select
                        value={filters.selectedClinics[0]?.toString() || 'all'}
                        onValueChange={(v) => onClinicChange?.(v === 'all' ? [] : [Number(v)])}
                      >
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder="Toutes les cliniques" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes les cliniques</SelectItem>
                          {clinics.map(clinic => (
                            <SelectItem key={clinic.id} value={clinic.id.toString()}>
                              {clinic.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {showServiceFilter && services.length > 0 && (
                    <div>
                      <Label className="text-xs text-slate-600">Services</Label>
                      <Select
                        value={filters.selectedServices[0]?.toString() || 'all'}
                        onValueChange={(v) => onServiceChange?.(v === 'all' ? [] : [Number(v)])}
                      >
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder="Tous les services" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les services</SelectItem>
                          {services.map(service => (
                            <SelectItem key={service.id} value={service.id.toString()}>
                              {service.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {showSensorFilter && sensors.length > 0 && (
                    <div>
                      <Label className="text-xs text-slate-600">Capteurs</Label>
                      <Select
                        value={filters.selectedSensors[0]?.toString() || 'all'}
                        onValueChange={(v) => onSensorChange?.(v === 'all' ? [] : [Number(v)])}
                      >
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder="Tous les capteurs" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les capteurs</SelectItem>
                          {sensors.map(sensor => (
                            <SelectItem key={sensor.id} value={sensor.id.toString()}>
                              {sensor.matricule}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {showOutlierToggle && (
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-slate-600">Afficher les valeurs aberrantes</Label>
                      <Switch
                        checked={filters.showOutliers}
                        onCheckedChange={onOutlierToggle}
                      />
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Reset Button */}
          <Button variant="ghost" size="sm" onClick={onReset} className="ml-auto">
            <RotateCcw className="w-4 h-4 mr-2" />
            Réinitialiser
          </Button>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-3">
            {filters.selectedClinics.map(id => {
              const clinic = clinics.find(c => c.id === id);
              return clinic ? (
                <Badge key={id} variant="secondary" className="bg-blue-100 text-blue-700">
                  {clinic.nom}
                  <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => {
                    onClinicChange?.(filters.selectedClinics.filter(cid => cid !== id));
                  }} />
                </Badge>
              ) : null;
            })}
            {filters.selectedServices.map(id => {
              const service = services.find(s => s.id === id);
              return service ? (
                <Badge key={id} variant="secondary" className="bg-green-100 text-green-700">
                  {service.nom}
                  <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => {
                    onServiceChange?.(filters.selectedServices.filter(sid => sid !== id));
                  }} />
                </Badge>
              ) : null;
            })}
            {filters.selectedSensors.map(id => {
              const sensor = sensors.find(s => s.id === id);
              return sensor ? (
                <Badge key={id} variant="secondary" className="bg-purple-100 text-purple-700">
                  {sensor.matricule}
                  <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => {
                    onSensorChange?.(filters.selectedSensors.filter(sid => sid !== id));
                  }} />
                </Badge>
              ) : null;
            })}
            {!filters.showOutliers && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                Sans valeurs aberrantes
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => onOutlierToggle?.(true)} />
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
