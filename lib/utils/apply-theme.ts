/**
 * Utility functions to help apply the sci-fi theme to existing components
 */

/**
 * Converts standard Tailwind background classes to sci-fi theme background classes
 * @param className The original className string
 * @returns The updated className with sci-fi theme background classes
 */
export function applySciFiBackground(className: string): string {
  // Replace standard background colors with sci-fi theme colors
  return className
    .replace(/bg-white/g, 'bg-[#1E293B]')
    .replace(/bg-gray-50/g, 'bg-[#0F172A]')
    .replace(/bg-gray-100/g, 'bg-[#1E293B]')
    .replace(/bg-blue-50/g, 'bg-[#60A5FA]/10')
    .replace(/bg-green-50/g, 'bg-[#10B981]/10')
    .replace(/bg-purple-50/g, 'bg-[#A855F7]/10')
    .replace(/bg-red-50/g, 'bg-[#EF4444]/10')
    .replace(/bg-yellow-50/g, 'bg-[#FACC15]/10');
}

/**
 * Converts standard Tailwind text classes to sci-fi theme text classes
 * @param className The original className string
 * @returns The updated className with sci-fi theme text classes
 */
export function applySciFiText(className: string): string {
  // Replace standard text colors with sci-fi theme colors
  return className
    .replace(/text-gray-900/g, 'text-[#F8FAFC]')
    .replace(/text-gray-800/g, 'text-[#F8FAFC]')
    .replace(/text-gray-700/g, 'text-[#CBD5E1]')
    .replace(/text-gray-600/g, 'text-[#CBD5E1]')
    .replace(/text-gray-500/g, 'text-[#94A3B8]')
    .replace(/text-gray-400/g, 'text-[#64748B]')
    .replace(/text-blue-600/g, 'text-[#60A5FA]')
    .replace(/text-green-600/g, 'text-[#10B981]')
    .replace(/text-purple-600/g, 'text-[#A855F7]')
    .replace(/text-red-600/g, 'text-[#EF4444]')
    .replace(/text-yellow-600/g, 'text-[#FACC15]');
}

/**
 * Converts standard Tailwind border classes to sci-fi theme border classes
 * @param className The original className string
 * @returns The updated className with sci-fi theme border classes
 */
export function applySciFiBorder(className: string): string {
  // Replace standard border colors with sci-fi theme colors
  return className
    .replace(/border-gray-200/g, 'border-[#334155]')
    .replace(/border-gray-300/g, 'border-[#334155]')
    .replace(/border-blue-200/g, 'border-[#60A5FA]/30')
    .replace(/border-green-200/g, 'border-[#10B981]/30')
    .replace(/border-purple-200/g, 'border-[#A855F7]/30')
    .replace(/border-red-200/g, 'border-[#EF4444]/30')
    .replace(/border-yellow-200/g, 'border-[#FACC15]/30');
}

/**
 * Applies all sci-fi theme transformations to a className string
 * @param className The original className string
 * @returns The updated className with all sci-fi theme classes
 */
export function applySciFiTheme(className: string): string {
  return applySciFiBorder(applySciFiText(applySciFiBackground(className)));
}