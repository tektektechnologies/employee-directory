const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";

export const primaryButton = `inline-flex items-center justify-center rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

export const secondaryButton = `inline-flex items-center justify-center rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 hover:border-stone-400 hover:bg-stone-50 ${focusRing}`;

export const textLink = `rounded font-medium text-indigo-700 underline-offset-2 hover:underline ${focusRing}`;

export const quietLink = `rounded-md px-3 py-2 text-stone-700 hover:bg-stone-100 hover:text-stone-900 ${focusRing}`;
