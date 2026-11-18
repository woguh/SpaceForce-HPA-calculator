import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** shadcn-style class merger used by registry components (Afterglow, coss, etc.). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
