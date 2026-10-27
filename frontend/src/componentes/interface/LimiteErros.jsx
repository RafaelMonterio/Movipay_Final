'use client';
import { Component } from 'react';
import { usarTema, obterCoresTema } from '@/contexto/contextoTema';
import Icon from '@/componentes/interface/Icone';

class LimiteErrosInner extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('LimiteErros caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      const { colors } = this.props;
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
          <div className="flex justify-center mb-4"><Icon name="alertTriangle" size={48} color="#F59E0B" /></div>
          <h2 className="text-xl font-bold mb-2" style={{ color: colors.text }}>Algo deu errado</h2>
          <p className="text-sm mb-6 max-w-sm" style={{ color: colors.textMuted }}>
            {this.state.error?.message || 'Ocorreu um erro inesperado nesta página.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-white font-semibold px-6 py-2.5 rounded-xl transition-all"
            style={{
              background: 'linear-gradient(135deg, #FF7A00, #FF9A33)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
          >
            Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function LimiteErros(props) {
  const { darkMode } = usarTema();
  const colors = obterCoresTema(darkMode);
  return <LimiteErrosInner {...props} colors={colors} />;
}
