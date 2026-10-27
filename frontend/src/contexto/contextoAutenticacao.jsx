'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import servicoAutenticacao from '@/servicos/servicoAutenticacao';

const ContextoAutenticacao = createContext(null);
function usuarioProntoParaTrabalhar(user) {
  return Boolean(user?.phone && (user?.cpf || user?.document) && (user?.birthDate || user?.data_nascimento) && ((user?.services || []).length || user?.category) && user?.accepted_terms !== false);
}

function setCookie(name, value, days = 7) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export function ProvedorAutenticacao({ children }) {
  const [user, setUser]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { setLoading(false); return; }
    servicoAutenticacao.obterUsuarioAtual()
      .then(u => setUser(u))
      .catch(() => {
        localStorage.removeItem('access_token');
        deleteCookie('access_token');
      })
      .finally(() => setLoading(false));
  }, []);

  async function entrar(email, password) {
    const u = await servicoAutenticacao.entrar(email, password);
    const token = localStorage.getItem('access_token');
    setCookie('access_token', token);
    setUser(u);
    router.push(u.mode === 'worker' ? '/trabalhador' : '/cliente');
  }

  async function cadastrar(nameOrPayload, email, password, mode = 'client', phone = '', bio = '', city = '') {
    const payload = typeof nameOrPayload === 'object'
      ? { ...nameOrPayload, city: nameOrPayload.city || 'Ribeirão Pires' }
      : { name: nameOrPayload, email, password, mode, phone, bio, city: city || 'Ribeirão Pires' };

    const u = await servicoAutenticacao.cadastrar(payload);
    const token = localStorage.getItem('access_token');
    setCookie('access_token', token);
    setIsFirstLogin(true);
    setUser(u);
    router.push(payload.mode === 'worker' ? '/trabalhador' : '/cliente');
  }

  async function alternarModo(mode) {
    if (mode === 'worker' && !usuarioProntoParaTrabalhar(user)) {
      router.push('/cliente/ativar-trabalhador');
      return { requiresActivation: true };
    }
    await servicoAutenticacao.alternarModo(mode);
    const token = localStorage.getItem('access_token');
    setCookie('access_token', token);
    setUser(prev => ({ ...prev, mode }));
    router.push(mode === 'worker' ? '/trabalhador' : '/cliente');
  }

  async function ativarModoTrabalhador(payload) {
    const u = await servicoAutenticacao.ativarModoTrabalhador(payload);
    const token = localStorage.getItem('access_token');
    setCookie('access_token', token);
    setUser(u);
    router.push('/trabalhador');
    return u;
  }
  function sair() {
    servicoAutenticacao.sair();
    deleteCookie('access_token');
    setUser(null);
    router.push('/entrar');
  }

  function dismissBoasVindas() {
    setIsFirstLogin(false);
    localStorage.setItem('onboarding_done', '1');
  }

  return (
    <ContextoAutenticacao.Provider value={{
      user, loading, isFirstLogin,
      entrar, cadastrar, sair, alternarModo, ativarModoTrabalhador, dismissBoasVindas
    }}>
      {children}
    </ContextoAutenticacao.Provider>
  );
}

export function usarAutenticacao() {
  const ctx = useContext(ContextoAutenticacao);
  if (!ctx) throw new Error('usarAutenticacao fora do ProvedorAutenticacao');
  return ctx;
}
