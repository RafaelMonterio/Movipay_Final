import { useState, useEffect } from 'react';
import api from '@/servicos/clienteApi';

export function usarApi(endpoint, deps = []) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  async function refetch() {
    try {
      setLoading(true);
      const res = await api.get(endpoint);
      setData(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refetch(); }, deps);

  return { data, loading, error, refetch };
}
