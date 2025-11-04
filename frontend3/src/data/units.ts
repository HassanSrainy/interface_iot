/**
 * Bibliothèque d'unités de mesure pour les capteurs
 */

export interface Unit {
  value: string;
  label: string;
  symbol: string;
  category: string;
}

export const UNITS: Unit[] = [
  // Température
  { value: "celsius", label: "Celsius", symbol: "°C", category: "Température" },
  { value: "fahrenheit", label: "Fahrenheit", symbol: "°F", category: "Température" },
  { value: "kelvin", label: "Kelvin", symbol: "K", category: "Température" },

  // Humidité
  { value: "percent", label: "Pourcentage", symbol: "%", category: "Humidité" },
  { value: "rh", label: "Humidité Relative", symbol: "% RH", category: "Humidité" },

  // Pression
  { value: "pascal", label: "Pascal", symbol: "Pa", category: "Pression" },
  { value: "bar", label: "Bar", symbol: "bar", category: "Pression" },
  { value: "psi", label: "PSI", symbol: "psi", category: "Pression" },
  { value: "atm", label: "Atmosphère", symbol: "atm", category: "Pression" },
  { value: "mmhg", label: "Millimètre de mercure", symbol: "mmHg", category: "Pression" },

  // Distance
  { value: "meter", label: "Mètre", symbol: "m", category: "Distance" },
  { value: "centimeter", label: "Centimètre", symbol: "cm", category: "Distance" },
  { value: "millimeter", label: "Millimètre", symbol: "mm", category: "Distance" },
  { value: "kilometer", label: "Kilomètre", symbol: "km", category: "Distance" },

  // Vitesse
  { value: "mps", label: "Mètre par seconde", symbol: "m/s", category: "Vitesse" },
  { value: "kmh", label: "Kilomètre par heure", symbol: "km/h", category: "Vitesse" },
  { value: "mph", label: "Mile par heure", symbol: "mph", category: "Vitesse" },

  // Luminosité
  { value: "lux", label: "Lux", symbol: "lx", category: "Luminosité" },
  { value: "lumen", label: "Lumen", symbol: "lm", category: "Luminosité" },
  { value: "candela", label: "Candela", symbol: "cd", category: "Luminosité" },

  // Puissance
  { value: "watt", label: "Watt", symbol: "W", category: "Puissance" },
  { value: "kilowatt", label: "Kilowatt", symbol: "kW", category: "Puissance" },
  { value: "horsepower", label: "Cheval-vapeur", symbol: "HP", category: "Puissance" },

  // Voltage
  { value: "volt", label: "Volt", symbol: "V", category: "Électrique" },
  { value: "millivolt", label: "Millivolt", symbol: "mV", category: "Électrique" },
  { value: "kilovolt", label: "Kilovolt", symbol: "kV", category: "Électrique" },

  // Courant
  { value: "ampere", label: "Ampère", symbol: "A", category: "Électrique" },
  { value: "milliampere", label: "Milliampère", symbol: "mA", category: "Électrique" },

  // Résistance
  { value: "ohm", label: "Ohm", symbol: "Ω", category: "Électrique" },
  { value: "kilohm", label: "Kiloohm", symbol: "kΩ", category: "Électrique" },
  { value: "megohm", label: "Mégaohm", symbol: "MΩ", category: "Électrique" },

  // Débit
  { value: "lps", label: "Litre par seconde", symbol: "L/s", category: "Débit" },
  { value: "lpm", label: "Litre par minute", symbol: "L/min", category: "Débit" },
  { value: "m3h", label: "Mètre cube par heure", symbol: "m³/h", category: "Débit" },

  // Volume
  { value: "liter", label: "Litre", symbol: "L", category: "Volume" },
  { value: "milliliter", label: "Millilitre", symbol: "mL", category: "Volume" },
  { value: "m3", label: "Mètre cube", symbol: "m³", category: "Volume" },

  // Masse
  { value: "gram", label: "Gramme", symbol: "g", category: "Masse" },
  { value: "kilogram", label: "Kilogramme", symbol: "kg", category: "Masse" },
  { value: "ton", label: "Tonne", symbol: "t", category: "Masse" },

  // Concentration
  { value: "ppm", label: "Partie par million", symbol: "ppm", category: "Concentration" },
  { value: "ppb", label: "Partie par milliard", symbol: "ppb", category: "Concentration" },
  { value: "mgl", label: "Milligramme par litre", symbol: "mg/L", category: "Concentration" },

  // pH
  { value: "ph", label: "pH", symbol: "pH", category: "Chimie" },

  // Autres
  { value: "decibel", label: "Décibel", symbol: "dB", category: "Son" },
  { value: "rpm", label: "Tour par minute", symbol: "RPM", category: "Rotation" },
  { value: "hz", label: "Hertz", symbol: "Hz", category: "Fréquence" },
  { value: "none", label: "Sans unité", symbol: "", category: "Autre" },
];

/**
 * Obtenir les catégories uniques
 */
export const getCategories = (): string[] => {
  return Array.from(new Set(UNITS.map((unit) => unit.category))).sort();
};

/**
 * Obtenir les unités par catégorie
 */
export const getUnitsByCategory = (category: string): Unit[] => {
  return UNITS.filter((unit) => unit.category === category);
};

/**
 * Obtenir une unité par sa valeur
 */
export const getUnitByValue = (value: string): Unit | undefined => {
  return UNITS.find((unit) => unit.value === value);
};

/**
 * Obtenir le symbole d'une unité par sa valeur
 */
export const getUnitSymbol = (value: string | null | undefined): string => {
  if (!value) return "";
  const unit = getUnitByValue(value);
  return unit?.symbol || "";
};

/**
 * Obtenir le label d'une unité par sa valeur
 */
export const getUnitLabel = (value: string | null | undefined): string => {
  if (!value) return "Sans unité";
  const unit = getUnitByValue(value);
  return unit?.label || value;
};
