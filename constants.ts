
import { ThemeConfig, ThemeType } from './types';

export const THEMES: Record<ThemeType, ThemeConfig> = {
  corporate: {
    bg: 'bg-slate-900',
    text: 'text-white',
    accent: 'text-blue-400',
    secondary: 'text-slate-400',
    font: 'font-sans',
    gradient: 'from-slate-900 to-slate-800'
  },
  modern: {
    bg: 'bg-white',
    text: 'text-zinc-900',
    accent: 'text-emerald-600',
    secondary: 'text-zinc-500',
    font: 'font-sans',
    gradient: 'from-white to-zinc-50'
  },
  minimal: {
    bg: 'bg-zinc-50',
    text: 'text-black',
    accent: 'text-orange-500',
    secondary: 'text-zinc-400',
    font: 'font-sans',
    gradient: 'from-zinc-50 to-white'
  },
  elegant: {
    bg: 'bg-stone-100',
    text: 'text-stone-900',
    accent: 'text-amber-800',
    secondary: 'text-stone-500',
    font: 'font-display',
    gradient: 'from-stone-100 to-stone-200'
  }
};
