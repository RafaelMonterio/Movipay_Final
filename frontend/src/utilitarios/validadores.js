export const isValidEmail    = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
export const isValidPassword = p => p && p.length >= 6;
export const isValidName     = n => n && n.trim().length >= 2;
