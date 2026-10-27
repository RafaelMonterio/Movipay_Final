import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LIGHT, DARK, HIGH_CONTRAST_LIGHT, HIGH_CONTRAST_DARK, BRAND } from './cores';

const STORAGE_KEY = '@movipay:theme_prefs_v1';
const ContextoTema = createContext(null);

export function ThemeProvider({ children }) {
  const [scheme, setScheme] = useState(Appearance.getColorScheme() || 'light'); // 'light' | 'dark'
  const [highContrast, setHighContrast] = useState(false);
  const [fontScale, setFontScale] = useState(1); // 0.8 a 1.4, igual ao painel de acessibilidade do site
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const prefs = JSON.parse(raw);
          if (prefs.scheme) setScheme(prefs.scheme);
          if (typeof prefs.highContrast === 'boolean') setHighContrast(prefs.highContrast);
          if (typeof prefs.fontScale === 'number') setFontScale(prefs.fontScale);
        }
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persist = useCallback((next) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const toggleScheme = useCallback(() => {
    setScheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      persist({ scheme: next, highContrast, fontScale });
      return next;
    });
  }, [highContrast, fontScale, persist]);

  const toggleHighContrast = useCallback(() => {
    setHighContrast((prev) => {
      const next = !prev;
      persist({ scheme, highContrast: next, fontScale });
      return next;
    });
  }, [scheme, fontScale, persist]);

  const changeFontScale = useCallback(
    (value) => {
      const clamped = Math.min(1.4, Math.max(0.8, value));
      setFontScale(clamped);
      persist({ scheme, highContrast, fontScale: clamped });
    },
    [scheme, highContrast, persist]
  );

  const palette = useMemo(() => {
    if (scheme === 'dark') return highContrast ? HIGH_CONTRAST_DARK : DARK;
    return highContrast ? HIGH_CONTRAST_LIGHT : LIGHT;
  }, [scheme, highContrast]);

  const theme = useMemo(
    () => ({
      ...palette,
      brand: BRAND,
      isDark: scheme === 'dark',
      highContrast,
      fontScale,
    }),
    [palette, scheme, highContrast, fontScale]
  );

  const rs = useCallback((size) => Math.round(size * fontScale), [fontScale]);

  if (!loaded) return null;

  return (
    <ContextoTema.Provider value={{ theme, toggleScheme, toggleHighContrast, changeFontScale, rs, scheme }}>
      {children}
    </ContextoTema.Provider>
  );
}

export function usarTema() {
  const ctx = useContext(ContextoTema);
  if (!ctx) throw new Error('usarTema deve ser usado dentro de um ThemeProvider');
  return ctx;
}
