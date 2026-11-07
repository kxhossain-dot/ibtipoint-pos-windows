export type ThemeColor = 'teal' | 'emerald' | 'indigo' | 'crimson' | 'purple' | 'amber';

export interface ThemeConfig {
  name: string;
  nameBn: string;
  primary: string;
  primaryHover: string;
  bgLight: string;
  border: string;
  text: string;
  badge: string;
  ring: string;
}

export const THEMES: Record<ThemeColor, ThemeConfig> = {
  teal: {
    name: 'Modern Teal',
    nameBn: 'মডার্ন টিল',
    primary: 'bg-teal-600',
    primaryHover: 'hover:bg-teal-700',
    bgLight: 'bg-teal-50 dark:bg-teal-950/40',
    border: 'border-teal-500',
    text: 'text-teal-600 dark:text-teal-400',
    badge: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300',
    ring: 'focus:ring-teal-500',
  },
  emerald: {
    name: 'Khata Green',
    nameBn: 'ঐতিহ্যবাহী খাতা সবুজ',
    primary: 'bg-emerald-600',
    primaryHover: 'hover:bg-emerald-700',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
    ring: 'focus:ring-emerald-500',
  },
  indigo: {
    name: 'Corporate Navy',
    nameBn: 'কর্পোরেট নেভি ব্লু',
    primary: 'bg-indigo-600',
    primaryHover: 'hover:bg-indigo-700',
    bgLight: 'bg-indigo-50 dark:bg-indigo-950/40',
    border: 'border-indigo-500',
    text: 'text-indigo-600 dark:text-indigo-400',
    badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
    ring: 'focus:ring-indigo-500',
  },
  crimson: {
    name: 'Ruby Crimson',
    nameBn: 'রুবী লাল',
    primary: 'bg-rose-600',
    primaryHover: 'hover:bg-rose-700',
    bgLight: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-500',
    text: 'text-rose-600 dark:text-rose-400',
    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300',
    ring: 'focus:ring-rose-500',
  },
  purple: {
    name: 'Royal Purple',
    nameBn: 'রয়েল পার্পল',
    primary: 'bg-purple-600',
    primaryHover: 'hover:bg-purple-700',
    bgLight: 'bg-purple-50 dark:bg-purple-950/40',
    border: 'border-purple-500',
    text: 'text-purple-600 dark:text-purple-400',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    ring: 'focus:ring-purple-500',
  },
  amber: {
    name: 'Golden Amber',
    nameBn: 'সোনালী অ্যাম্বার',
    primary: 'bg-amber-600',
    primaryHover: 'hover:bg-amber-700',
    bgLight: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
    ring: 'focus:ring-amber-500',
  },
};
