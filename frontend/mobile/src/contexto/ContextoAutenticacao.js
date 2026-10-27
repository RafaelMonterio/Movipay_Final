import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiAutenticacao } from '../apis/autenticacao';
import { apiConversas } from '../apis/redeSocial';
import { CHAVE_TOKEN, CHAVE_USUARIO } from '../apis/clienteHttp';

const ContextoAutenticacao = createContext(null);

export function ProvedorAutenticacao({ children }) {
  const [user, setUser] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [contagemNaoLidas, setContagemNaoLidas] = useState(0);

  // Contagem de mensagens não lidas, para o "sininho" no botão de chat. Fica aqui (não numa tela específica) porque é isso que permite o badge aparecer...
  const atualizarNaoLidas = useCallback(async () => {
    try {
      const conversas = await apiConversas.conversas();
      const total = conversas.reduce((sum, c) => sum + (Number(c.quantidade_nao_lidas) || 0), 0);
      setContagemNaoLidas(total);
    } catch {
      // Falha de rede aqui não é motivo pra incomodar ninguém — o badge só fica com o último valor conhecido até a próxima tentativa.
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setContagemNaoLidas(0);
      return undefined;
    }
    atualizarNaoLidas();
    const id = setInterval(atualizarNaoLidas, 25000);
    return () => clearInterval(id);
  }, [user, atualizarNaoLidas]);

  useEffect(() => {
    (async () => {
      try {
        const [token, rawUser] = await Promise.all([
          AsyncStorage.getItem(CHAVE_TOKEN),
          AsyncStorage.getItem(CHAVE_USUARIO),
        ]);
        if (token && rawUser) {
          setUser(JSON.parse(rawUser));
          // Revalida contra o backend (o perfil pode ter mudado desde a última sessão)
          try {
            const { usuario: fresh } = await apiAutenticacao.me();
            setUser(fresh);
            await AsyncStorage.setItem(CHAVE_USUARIO, JSON.stringify(fresh));
          } catch (err) {
            // Só desloga quando o SERVIDOR recusou o token (401) — um erro de conectividade (sem rede, backend fora do ar, URL mal configurada num build standalo...
            if (err.status === 401) {
              await AsyncStorage.multiRemove([CHAVE_TOKEN, CHAVE_USUARIO]);
              setUser(null);
            }
          }
        }
      } finally {
        setCarregando(false);
      }
    })();
  }, []);

  const persistirSessao = useCallback(async (token, nextUser) => {
    await AsyncStorage.setItem(CHAVE_TOKEN, token);
    await AsyncStorage.setItem(CHAVE_USUARIO, JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (email, senha) => {
      const { token_acesso, usuario: loggedUser } = await apiAutenticacao.login(email, senha);
      await persistirSessao(token_acesso, loggedUser);
      return loggedUser;
    },
    [persistirSessao]
  );

  const register = useCallback(
    async (payload) => {
      const { token_acesso, usuario: newUser } = await apiAutenticacao.register(payload);
      await persistirSessao(token_acesso, newUser);
      return newUser;
    },
    [persistirSessao]
  );

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove([CHAVE_TOKEN, CHAVE_USUARIO]);
    setUser(null);
  }, []);

  const alternarModo = useCallback(
    async (modo) => {
      const { token_acesso, usuario: updated } = await apiAutenticacao.alternarModo(modo);
      await persistirSessao(token_acesso, updated);
      return updated;
    },
    [persistirSessao]
  );

  const atualizarPerfil = useCallback(
    async (payload) => {
      const { usuario: updated } = await apiAutenticacao.atualizarPerfil(user.id, payload);
      setUser(updated);
      await AsyncStorage.setItem(CHAVE_USUARIO, JSON.stringify(updated));
      return updated;
    },
    [user]
  );

  const atualizarUsuario = useCallback(async () => {
    const { usuario: fresh } = await apiAutenticacao.me();
    setUser(fresh);
    await AsyncStorage.setItem(CHAVE_USUARIO, JSON.stringify(fresh));
    return fresh;
  }, []);

  /** Salva a nova foto de perfil no backend e atualiza a sessão local. */
  const atualizarAvatar = useCallback(
    async (avatarUrl) => {
      const { usuario: updated } = avatarUrl
        ? await apiAutenticacao.atualizarAvatar(user.id, avatarUrl)
        : await apiAutenticacao.removerAvatar(user.id);
      setUser(updated);
      await AsyncStorage.setItem(CHAVE_USUARIO, JSON.stringify(updated));
      return updated;
    },
    [user]
  );

  // Papéis derivados num lugar só. `modo` continua sendo apenas a tela ATIVA (cliente ou trabalhador); quem diz o que a conta PODE fazer é `eh_cliente`/...
  const roles = {
    ehCliente: Boolean(user?.eh_cliente),
    ehTrabalhador: Boolean(user?.eh_trabalhador),
    ehHibrida: Boolean(user?.eh_cliente && user?.eh_trabalhador),
    tipoConta: user?.tipo_conta || (user?.eh_trabalhador ? 'worker' : 'client'),
    modoAtivo: user?.modo || 'client',
    slugPlano: user?.slug_plano || 'formiga',
  };

  return (
    <ContextoAutenticacao.Provider
      value={{ user,
        carregando,
        login,
        register,
        logout,
        alternarModo,
        atualizarPerfil,
        atualizarAvatar,
        atualizarUsuario,
        contagemNaoLidas,
        atualizarNaoLidas,
        ...roles,
      }}
    >
      {children}
    </ContextoAutenticacao.Provider>
  );
}

export function usarAutenticacao() {
  const ctx = useContext(ContextoAutenticacao);
  if (!ctx) throw new Error('usarAutenticacao deve ser usado dentro de um ProvedorAutenticacao');
  return ctx;
}
