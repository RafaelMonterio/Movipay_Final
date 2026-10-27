export const LEVELS = [
  { key: 'iniciante', label: 'Iniciante', min: 0, icone: '🌱' },
  { key: 'bronze', label: 'Bronze', min: 100, icone: '🥉' },
  { key: 'prata', label: 'Prata', min: 300, icone: '🥈' },
  { key: 'ouro', label: 'Ouro', min: 600, icone: '🥇' },
  { key: 'platina', label: 'Platina', min: 1000, icone: '💎' },
  { key: 'diamante', label: 'Diamante', min: 2000, icone: '👑' },
];

// O backend já manda `levelInfo` pronto em /autenticacao/me, /usuarios/:id e /pontos/balance — esta função é só um fallback para telas que só têm o número de po...
export function obterInformacoesNivel(pontos) {
  const p = Number(pontos) || 0;
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) if (p >= LEVELS[i].min) idx = i;
  const current = LEVELS[idx];
  const next = LEVELS[idx + 1] || null;
  const span = next ? next.min - current.min : 1;
  const progress = next ? Math.min(1, Math.max(0, (p - current.min) / span)) : 1;
  return {
    pontos: p,
    level: current.key,
    levelLabel: current.label,
    levelIcon: current.icone,
    levelIndex: idx,
    totalLevels: LEVELS.length,
    nextLevel: next?.key || null,
    nextLevelLabel: next?.label || null,
    pointsToNext: next ? next.min - p : 0,
    progress,
  };
}
