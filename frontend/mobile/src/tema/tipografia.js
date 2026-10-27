// Igual ao site: Fraunces para títulos/display, Inter para corpo/UI, IBM Plex Mono para números técnicos (preços, estatísticas).
export const FONT_MAP = {
  Fraunces_500Medium: require('@expo-google-fonts/fraunces').Fraunces_500Medium,
  Fraunces_700Bold: require('@expo-google-fonts/fraunces').Fraunces_700Bold,
  Fraunces_900Black: require('@expo-google-fonts/fraunces').Fraunces_900Black,
  Fraunces_600SemiBold_Italic: require('@expo-google-fonts/fraunces').Fraunces_600SemiBold_Italic,
  Inter_400Regular: require('@expo-google-fonts/inter').Inter_400Regular,
  Inter_500Medium: require('@expo-google-fonts/inter').Inter_500Medium,
  Inter_600SemiBold: require('@expo-google-fonts/inter').Inter_600SemiBold,
  Inter_700Bold: require('@expo-google-fonts/inter').Inter_700Bold,
  Inter_800ExtraBold: require('@expo-google-fonts/inter').Inter_800ExtraBold,
  IBMPlexMono_500Medium: require('@expo-google-fonts/ibm-plex-mono').IBMPlexMono_500Medium,
  IBMPlexMono_600SemiBold: require('@expo-google-fonts/ibm-plex-mono').IBMPlexMono_600SemiBold,
};

export const FONTES = {
  display: 'Fraunces_700Bold',
  displayBlack: 'Fraunces_900Black',
  displayMedium: 'Fraunces_500Medium',
  displayItalic: 'Fraunces_600SemiBold_Italic',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  bodyExtraBold: 'Inter_800ExtraBold',
  mono: 'IBMPlexMono_500Medium',
  monoSemiBold: 'IBMPlexMono_600SemiBold',
};

// Escala de tamanho — multiplicada pela preferência de "escala de fonte" (80% a 140%) que replica o painel de acessibilidade do site.
export const TAMANHOS = {
  xs: 12,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
  display: 34,
};
