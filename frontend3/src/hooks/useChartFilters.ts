// src/hooks/useChartFilters.ts
import { useState, useMemo, useEffect } from 'react';
import { startOfDay, endOfDay, subDays, subHours, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

export type TimeRange = 
  | 'last-hour'
  | 'last-6-hours'
  | 'last-24-hours'
  | 'last-7-days'
  | 'last-30-days'
  | 'this-week'
  | 'this-month'
  | 'custom';

export type ChartGranularity = 'minute' | 'hour' | 'day' | 'week' | 'month';

export interface ChartFilterOptions {
  timeRange: TimeRange;
  startDate: Date | null;
  endDate: Date | null;
  granularity: ChartGranularity;
  selectedClinics: number[];
  selectedServices: number[];
  selectedSensors: number[];
  showOutliers: boolean;
}

// Fonction pour calculer les dates selon le range
export function getDateRangeFromTimeRange(timeRange: TimeRange, customStart?: Date, customEnd?: Date): { start: Date; end: Date } {
  const now = new Date();
  
  switch (timeRange) {
    case 'last-hour':
      return { start: subHours(now, 1), end: now };
    case 'last-6-hours':
      return { start: subHours(now, 6), end: now };
    case 'last-24-hours':
      return { start: subHours(now, 24), end: now };
    case 'last-7-days':
      return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) };
    case 'last-30-days':
      return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
    case 'this-week':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'this-month':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'custom':
      return { 
        start: customStart || startOfDay(subDays(now, 7)), 
        end: customEnd || endOfDay(now) 
      };
    default:
      return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) };
  }
}

// Fonction pour suggérer la granularité selon le range
export function getSuggestedGranularity(timeRange: TimeRange): ChartGranularity {
  switch (timeRange) {
    case 'last-hour':
    case 'last-6-hours':
      return 'minute';
    case 'last-24-hours':
      return 'hour';
    case 'last-7-days':
    case 'this-week':
      return 'day';
    case 'last-30-days':
    case 'this-month':
      return 'week';
    default:
      return 'day';
  }
}

export function useChartFilters(storageKey: string, initialOptions?: Partial<ChartFilterOptions>) {
  const STORAGE_KEY = `chart-filters-${storageKey}`;
  
  // Charger les préférences depuis localStorage
  const loadPreferences = (): Partial<ChartFilterOptions> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Reconvertir les dates
        if (parsed.startDate) parsed.startDate = new Date(parsed.startDate);
        if (parsed.endDate) parsed.endDate = new Date(parsed.endDate);
        return parsed;
      }
    } catch (error) {
      console.error('Error loading chart filter preferences:', error);
    }
    return {};
  };

  const preferences = loadPreferences();

  const [filters, setFilters] = useState<ChartFilterOptions>({
    timeRange: preferences.timeRange || initialOptions?.timeRange || 'last-7-days',
    startDate: preferences.startDate || initialOptions?.startDate || null,
    endDate: preferences.endDate || initialOptions?.endDate || null,
    granularity: preferences.granularity || initialOptions?.granularity || 'day',
    selectedClinics: preferences.selectedClinics || initialOptions?.selectedClinics || [],
    selectedServices: preferences.selectedServices || initialOptions?.selectedServices || [],
    selectedSensors: preferences.selectedSensors || initialOptions?.selectedSensors || [],
    showOutliers: preferences.showOutliers ?? initialOptions?.showOutliers ?? true,
  });

  // Sauvegarder les préférences dans localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch (error) {
      console.error('Error saving chart filter preferences:', error);
    }
  }, [filters, STORAGE_KEY]);

  // Calculer les dates effectives
  const dateRange = useMemo(() => {
    return getDateRangeFromTimeRange(filters.timeRange, filters.startDate || undefined, filters.endDate || undefined);
  }, [filters.timeRange, filters.startDate, filters.endDate]);

  // Mettre à jour un filtre
  const updateFilter = <K extends keyof ChartFilterOptions>(key: K, value: ChartFilterOptions[K]) => {
    setFilters(prev => {
      const updated = { ...prev, [key]: value };
      
      // Auto-ajuster la granularité si le range change
      if (key === 'timeRange' && value !== 'custom') {
        updated.granularity = getSuggestedGranularity(value as TimeRange);
      }
      
      return updated;
    });
  };

  // Réinitialiser tous les filtres
  const resetFilters = () => {
    setFilters({
      timeRange: 'last-7-days',
      startDate: null,
      endDate: null,
      granularity: 'day',
      selectedClinics: [],
      selectedServices: [],
      selectedSensors: [],
      showOutliers: true,
    });
  };

  // Appliquer plusieurs filtres à la fois
  const updateMultipleFilters = (updates: Partial<ChartFilterOptions>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  };

  return {
    filters,
    dateRange,
    updateFilter,
    updateMultipleFilters,
    resetFilters,
    setTimeRange: (range: TimeRange) => updateFilter('timeRange', range),
    setGranularity: (granularity: ChartGranularity) => updateFilter('granularity', granularity),
    setDateRange: (start: Date | null, end: Date | null) => {
      updateMultipleFilters({ timeRange: 'custom', startDate: start, endDate: end });
    },
  };
}
