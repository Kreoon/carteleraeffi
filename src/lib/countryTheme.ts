// Paletas de branding por país — usadas en headers, gradients y acentos del reporte premium
export interface CountryTheme {
  primary: string;
  accent: string;
  gradient: string; // Tailwind gradient classes
  textOnPrimary: string;
}

export const countryThemes: Record<string, CountryTheme> = {
  Colombia: {
    primary: '#FFCD00',
    accent: '#003893',
    gradient: 'from-yellow-400 via-blue-600 to-red-600',
    textOnPrimary: 'text-slate-900',
  },
  Ecuador: {
    primary: '#FFD100',
    accent: '#DE2910',
    gradient: 'from-yellow-400 via-blue-700 to-red-600',
    textOnPrimary: 'text-slate-900',
  },
  Guatemala: {
    primary: '#4997D0',
    accent: '#FFFFFF',
    gradient: 'from-sky-400 via-slate-100 to-sky-400',
    textOnPrimary: 'text-slate-900',
  },
  'República Dominicana': {
    primary: '#002D62',
    accent: '#CE1126',
    gradient: 'from-blue-800 via-white to-red-600',
    textOnPrimary: 'text-white',
  },
  'Costa Rica': {
    primary: '#002B7F',
    accent: '#CE1126',
    gradient: 'from-blue-800 via-white to-red-600',
    textOnPrimary: 'text-white',
  },
};

export function getCountryTheme(country: string): CountryTheme {
  return (
    countryThemes[country] ?? {
      primary: '#0ea5e9',
      accent: '#1e293b',
      gradient: 'from-sky-500 to-slate-800',
      textOnPrimary: 'text-white',
    }
  );
}
