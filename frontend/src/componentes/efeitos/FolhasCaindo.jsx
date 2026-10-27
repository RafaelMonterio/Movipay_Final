'use client';
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── ÍCONE SVG DA FOLHA COM TRAÇO DELICADO E NATURAL ───────────────────── */
export function LeafIcon({ size = 20, color = '#22D31B', style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <path d="M5 21c0-9 6-15 15-15-1 9-7 15-15 15z" />
      <path d="M5 21c3-3 6-6 9-9" />
    </svg>
  );
}

const LEAF_COLORS = ['#22D31B', '#FF9A33', '#10B981', '#F59E0B', '#84CC16'];

// Contexto global compartilhado entre as folhas que caem do topo e o rodapé com caminhão
const LeafContext = createContext(null);

export function LeafProvider({ children, count = 24 }) {
  const [mounted, setMounted] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [collectedCount, setCollectedCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    // Cria as folhas que iniciam no topo do site e caem ao longo da página
    const initial = Array.from({ length: count }, (_, i) => {
      const xPct = 2 + (i * 95) / count + Math.sin(i * 3.7) * 1.8;
      const size = 14 + (i % 4) * 3;
      const color = LEAF_COLORS[i % LEAF_COLORS.length];
      const duration = 6.5 + ((i * 2.1) % 4);
      const delay = (i * 0.35) % 5;
      const rotDir = i % 2 === 0 ? 1 : -1;
      const targetBottom = 4 + (i % 4) * 4.5 + Math.sin(i * 1.9) * 2;
      const finalRotate = -40 + ((i * 47) % 80);

      return {
        id: `leaf-${i}`,
        index: i,
        xPct: Math.max(2, Math.min(97, xPct)),
        size,
        color,
        duration,
        delay,
        rotDir,
        targetBottom,
        finalRotate,
        status: 'falling', // 'falling' -> 'landed' -> 'collected'
        swayX: [0, (i % 2 === 0 ? 1 : -1) * 24, (i % 2 === 0 ? -1 : 1) * 20, 0],
        rotate: [0, 180 * rotDir, 360 * rotDir],
      };
    });
    setLeaves(initial);
  }, [count]);

  // Quando a folha chega ao final da queda, ela POUSA no footer e NÃO SOME
  const landLeaf = useCallback((leafId) => {
    setLeaves((prev) =>
      prev.map((l) => (l.id === leafId ? { ...l, status: 'landed' } : l))
    );
  }, []);

  // Quando o caminhão passa e aspira a folha que estava parada no chão
  const collectLeaf = useCallback((leafId) => {
    setLeaves((prev) =>
      prev.map((l) => {
        if (l.id === leafId) {
          return { ...l, status: 'collected' };
        }
        return l;
      })
    );
    setCollectedCount((prev) => prev + 1);

    // Após ser coletada pelo caminhão, a mesma folha volta para o topo do site para cair de novo
    setTimeout(() => {
      setLeaves((prev) =>
        prev.map((l) => {
          if (l.id === leafId) {
            const newXPct = 2 + Math.random() * 95;
            const newDuration = 6.5 + Math.random() * 3.5;
            const newTargetBottom = 4 + Math.random() * 16;
            const newRotDir = Math.random() > 0.5 ? 1 : -1;
            return {
              ...l,
              status: 'falling',
              xPct: Math.max(2, Math.min(97, newXPct)),
              duration: newDuration,
              delay: 0.05,
              targetBottom: newTargetBottom,
              finalRotate: -40 + Math.random() * 80,
              rotDir: newRotDir,
              swayX: [0, (Math.random() - 0.5) * 36, (Math.random() - 0.5) * 36, 0],
              rotate: [0, 180 * newRotDir, 360 * newRotDir],
            };
          }
          return l;
        })
      );
    }, 1200);
  }, []);

  return (
    <LeafContext.Provider value={{ mounted, leaves, landLeaf, collectLeaf, collectedCount }}>
      {children}
    </LeafContext.Provider>
  );
}

export function useLeaves() {
  return useContext(LeafContext);
}

/**
 * FolhasCaindo
 * ──────────────
 * Queda suave das folhas a partir do topo do site.
 * Ao atingirem o final da queda, pousam fisicamente no rodapé sem desaparecer.
 */
export default function FolhasCaindo({ count = 24 }) {
  const context = useLeaves();

  // Se estiver dentro de um LeafProvider, usa o estado compartilhado com o Footer e Caminhão
  if (context && context.mounted) {
    const { leaves, landLeaf } = context;
    const fallingList = leaves.filter((l) => l.status === 'falling');

    return (
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          // Camada decorativa: deve ficar por trás de TODO o conteúdo (cards,
          // sidebar, cabeçalho etc). Um z-index negativo garante isso desde
          // que o contêiner raiz da página estabeleça seu próprio contexto de
          // empilhamento (ver `zIndex: 0` nos wrappers que usam este
          // componente) — assim as folhas ficam visíveis sobre o fundo da
          // página, mas sempre atrás de qualquer elemento em primeiro plano.
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        {fallingList.map((l) => (
          <motion.div
            key={l.id}
            className="pointer-events-none absolute top-0"
            style={{ left: `${l.xPct}%` }}
            initial={{ y: -50, x: 0, opacity: 0, rotate: 0 }}
            animate={{
              y: 'calc(100vh - 35px)',
              x: l.swayX,
              opacity: [0, 1, 1, 1],
              rotate: l.rotate,
            }}
            transition={{
              duration: l.duration,
              delay: l.delay,
              ease: 'linear',
            }}
            onAnimationComplete={() => landLeaf(l.id)}
          >
            <LeafIcon size={l.size} color={l.color} />
          </motion.div>
        ))}
      </div>
    );
  }

  // Fallback para páginas sem LeafProvider
  return <FallbackFolhasCaindo count={count} />;
}

function FallbackFolhasCaindo({ count = 24 }) {
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    const list = Array.from({ length: count }, (_, i) => {
      const x = ((i * 37.3 + Math.sin(i * 9.1) * 23) % 96 + 96) % 96 + 2;
      const size = 13 + ((i * 7) % 11);
      const color = LEAF_COLORS[i % LEAF_COLORS.length];
      const duration = 8 + ((i * 3.7) % 7);
      const delay = (i * 1.3) % 9;
      const rotDir = i % 2 === 0 ? 1 : -1;
      const sway1 = Math.sin(i * 1.5) * 28;
      const sway2 = Math.cos(i * 2.1) * 32;

      return {
        id: i,
        x,
        size,
        color,
        duration,
        delay,
        swayX: [0, sway1, sway2, 0],
        rotate: [0, 160 * rotDir, 340 * rotDir, 520 * rotDir],
      };
    });
    setLeaves(list);
  }, [count]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      {leaves.map((l) => (
        <motion.div
          key={l.id}
          className="pointer-events-none absolute top-0"
          style={{ left: `${l.x}%` }}
          initial={{ y: -50, x: 0, opacity: 0, rotate: 0 }}
          animate={{
            y: '115vh',
            x: l.swayX,
            opacity: [0, 0.85, 0.85, 0],
            rotate: l.rotate,
          }}
          transition={{
            duration: l.duration,
            delay: l.delay,
            repeat: Infinity,
            repeatType: 'loop',
            ease: 'linear',
          }}
        >
          <LeafIcon size={l.size} color={l.color} />
        </motion.div>
      ))}
    </div>
  );
}

/**
 * FooterLeafPile
 * ──────────────
 * - Exibe as folhas que CAÍRAM DO TOPO e pousaram no chão do footer (nenhuma folha nasce do nada).
 * - O caminhão aspirador passa recolhendo e sugando todas as folhas que estão no chão.
 */
export function FooterLeafPile() {
  const context = useLeaves();
  const containerRef = useRef(null);
  const truckRef = useRef(null);
  const wheelLeftRef = useRef(null);
  const wheelRightRef = useRef(null);

  const leaves = context?.leaves || [];
  const collectLeaf = context?.collectLeaf;
  const collectedCount = context?.collectedCount || 0;

  // Folhas que pousaram no chão ou estão sendo sugadas pelo caminhão
  const groundLeaves = leaves.filter((l) => l.status === 'landed' || l.status === 'collected');
  const groundLeavesRef = useRef(groundLeaves);
  groundLeavesRef.current = groundLeaves;

  // Animação 60fps do caminhão e sucção das folhas do chão
  useEffect(() => {
    let animId;
    let lastTime = performance.now();
    let truckX = -260;
    let direction = 1; // 1 = esquerda -> direita, -1 = direita -> esquerda
    let speed = 160; // pixels por segundo
    let wheelAngle = 0;
    let isWaitingTurn = false;
    let turnWaitTime = 0;

    const updateFrame = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const container = containerRef.current;
      const truck = truckRef.current;

      if (!container || !truck) {
        animId = requestAnimationFrame(updateFrame);
        return;
      }

      const containerWidth = container.offsetWidth || 1200;

      if (isWaitingTurn) {
        turnWaitTime -= dt;
        if (turnWaitTime <= 0) {
          isWaitingTurn = false;
        }
      } else {
        truckX += direction * speed * dt;
        wheelAngle += direction * (speed * dt * 3.5);

        truck.style.transform = `translateX(${truckX}px) scaleX(${direction})`;
        if (wheelLeftRef.current) wheelLeftRef.current.style.transform = `rotate(${wheelAngle}deg)`;
        if (wheelRightRef.current) wheelRightRef.current.style.transform = `rotate(${wheelAngle}deg)`;

        // Ponto do bocal de sucção do caminhão
        const suctionX = direction === 1 ? truckX + 160 : truckX + 40;

        // Verifica folhas no chão para serem sugadas
        const currentGround = groundLeavesRef.current;
        for (let i = 0; i < currentGround.length; i++) {
          const leaf = currentGround[i];
          if (leaf.status !== 'landed') continue;

          const leafPixelX = (leaf.xPct / 100) * containerWidth;
          const dist = Math.abs(suctionX - leafPixelX);

          if (dist <= 50) {
            if (collectLeaf) {
              collectLeaf(leaf.id);
            }
          }
        }

        // Fim do percurso
        if (direction === 1 && truckX > containerWidth + 60) {
          direction = -1;
          truckX = containerWidth + 80;
          isWaitingTurn = true;
          turnWaitTime = 0.5;
        } else if (direction === -1 && truckX < -280) {
          direction = 1;
          truckX = -270;
          isWaitingTurn = true;
          turnWaitTime = 0.5;
        }
      }

      animId = requestAnimationFrame(updateFrame);
    };

    animId = requestAnimationFrame(updateFrame);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [collectLeaf]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 2,
      }}
    >
      <style>{`
        .ground-leaf-node {
          position: absolute;
          transition: transform 0.38s cubic-bezier(0.2, 0.9, 0.3, 1.2), opacity 0.35s ease-out, filter 0.35s ease-out;
          will-change: transform, opacity;
          pointer-events: none;
        }

        .ground-leaf-node.landed {
          animation: leafTouchGround 0.5s ease-out forwards;
        }

        .ground-leaf-node.collected {
          transform: translateY(-44px) scale(0.16) rotate(540deg) !important;
          opacity: 0 !important;
          filter: drop-shadow(0 0 8px #22D31B) !important;
        }

        @keyframes leafTouchGround {
          0% {
            transform: translateY(-20px) scale(1.1);
            opacity: 0.8;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }

        .truck-wrapper-box {
          position: absolute;
          bottom: 12px;
          left: 0;
          width: 220px;
          height: 95px;
          z-index: 15;
          pointer-events: none;
          will-change: transform;
        }

        .truck-body-box {
          position: relative;
          width: 200px;
          height: 90px;
          animation: truckShakeBox 0.18s ease-in-out infinite;
        }

        .truck-shadow-box {
          position: absolute;
          bottom: -8px;
          left: 10px;
          width: 180px;
          height: 12px;
          background: rgba(0, 0, 0, 0.22);
          border-radius: 50%;
          filter: blur(2px);
        }

        .truck-cabine-box {
          position: absolute;
          right: 0;
          top: 8px;
          width: 78px;
          height: 62px;
          background: #F0872B;
          border-radius: 10px 10px 0 0;
          z-index: 2;
          box-shadow: inset 0 -3px 0 rgba(0,0,0,0.12);
        }

        .truck-window-box {
          position: absolute;
          right: 12px;
          top: 12px;
          width: 48px;
          height: 30px;
          background: #C9D6D9;
          border-radius: 4px;
          border: 2px solid #3a3530;
        }

        .truck-detalhe-box {
          position: absolute;
          right: -8px;
          bottom: 4px;
          width: 14px;
          height: 10px;
          background: #FF9A33;
          border-radius: 3px;
          z-index: 1;
        }

        .truck-vacuum-brush {
          position: absolute;
          right: 12px;
          bottom: -4px;
          width: 32px;
          height: 8px;
          background: #22D31B;
          border-radius: 4px;
          box-shadow: 0 0 10px rgba(34, 211, 27, 0.6);
          z-index: 1;
          animation: vacuumPulse 0.4s ease-in-out infinite alternate;
        }

        .truck-bau-box {
          position: absolute;
          left: 0;
          top: 0;
          width: 130px;
          height: 70px;
          background: #2E7D4F;
          border-radius: 8px 8px 0 0;
          z-index: 1;
          box-shadow: inset 0 -4px 0 rgba(0,0,0,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .truck-leaf-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(0, 0, 0, 0.35);
          padding: 3px 8px;
          border-radius: 12px;
          color: #fff;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.5px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .truck-wheel-unit {
          position: absolute;
          bottom: -12px;
          width: 32px;
          height: 32px;
          background: #f0e4c8;
          border-radius: 50%;
          border: 6px solid #3a3530;
          z-index: 3;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .truck-wheel-unit::after {
          content: '';
          width: 6px;
          height: 6px;
          background: #3a3530;
          border-radius: 50%;
        }

        .truck-wheel-unit-l { left: 36px; }
        .truck-wheel-unit-r { left: 128px; }

        .truck-smoke-container {
          position: absolute;
          left: -35px;
          top: 14px;
          width: 50px;
          height: 60px;
          pointer-events: none;
          z-index: 5;
        }

        .truck-smoke-dot {
          position: absolute;
          bottom: 0;
          border-radius: 50%;
          filter: blur(3px);
          opacity: 0;
          animation: smokePuffBox 1.6s ease-out infinite;
        }

        .truck-smoke-dot:nth-child(1) { left: 0px; width: 14px; height: 14px; background: rgba(200, 200, 200, 0.6); animation-delay: 0s; }
        .truck-smoke-dot:nth-child(2) { left: 12px; width: 12px; height: 12px; background: rgba(190, 190, 190, 0.55); animation-delay: 0.3s; }
        .truck-smoke-dot:nth-child(3) { left: 22px; width: 16px; height: 16px; background: rgba(210, 210, 210, 0.5); animation-delay: 0.6s; }
        .truck-smoke-dot:nth-child(4) { left: 8px; width: 10px; height: 10px; background: rgba(180, 180, 180, 0.65); animation-delay: 0.9s; }
        .truck-smoke-dot:nth-child(5) { left: 18px; width: 14px; height: 14px; background: rgba(195, 195, 195, 0.5); animation-delay: 1.2s; }

        @keyframes truckShakeBox {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-1px); }
          100% { transform: translateY(0px); }
        }

        @keyframes vacuumPulse {
          0% { opacity: 0.7; transform: scaleX(0.9); }
          100% { opacity: 1; transform: scaleX(1.1); }
        }

        @keyframes smokePuffBox {
          0% { opacity: 0.8; transform: translateY(0) scale(0.5); }
          50% { opacity: 0.5; transform: translateY(-18px) scale(1.2); }
          100% { opacity: 0; transform: translateY(-40px) scale(2); }
        }
      `}</style>

      {/* ── AS FOLHAS QUE CAÍRAM DO TOPO E POUSARAM NO CHÃO DO FOOTER ──── */}
      {groundLeaves.map((l) => (
        <div
          key={l.id}
          className={`ground-leaf-node ${l.status}`}
          style={{
            left: `${l.xPct}%`,
            bottom: `${l.targetBottom}px`,
            transform: `rotate(${l.finalRotate}deg)`,
            filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.14))',
          }}
        >
          <LeafIcon size={l.size} color={l.color} />
        </div>
      ))}

      {/* ── CAMINHÃO COLETOR DE FOLHAS ───────────────────────────────── */}
      <div ref={truckRef} className="truck-wrapper-box">
        <div className="truck-body-box">
          <div className="truck-shadow-box" />
          <div className="truck-bau-box" />
          <div className="truck-cabine-box">
            <div className="truck-window-box" />
          </div>
          <div className="truck-detalhe-box" />
          <div className="truck-vacuum-brush" />
          <div ref={wheelLeftRef} className="truck-wheel-unit truck-wheel-unit-l" />
          <div ref={wheelRightRef} className="truck-wheel-unit truck-wheel-unit-r" />
          <div className="truck-smoke-container">
            <div className="truck-smoke-dot" />
            <div className="truck-smoke-dot" />
            <div className="truck-smoke-dot" />
            <div className="truck-smoke-dot" />
            <div className="truck-smoke-dot" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Truck alias component para manter compatibilidade
 */
export function Truck() {
  return null;
}

