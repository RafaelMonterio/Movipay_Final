'use client';
import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/componentes/interface/Notificacao';
import api from '@/servicos/clienteApi';
import Icon from '@/componentes/interface/Icone';

export default function EnvioAvatar({ user, onUpdate }) {
  const inputRef  = useRef(null);
  const toast     = useToast();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(user?.avatar_url || null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Valida tipo e tamanho (max 2MB)
    if (!file.type.startsWith('image/')) {
      toast('Selecione uma imagem válida (JPG, PNG, WEBP)', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast('Imagem muito grande. Máximo 2MB.', 'error');
      return;
    }

    // Converte para base64
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      setPreview(base64);
      try {
        setLoading(true);
        // Envia base64 para a API — salvo na coluna avatar_url
        const { data } = await api.patch(`/usuarios/${user.id}`, {
          avatar_url: base64,
        });
        onUpdate?.(data);
        toast('Foto atualizada!', 'success');
      } catch {
        toast('Erro ao salvar foto', 'error');
        setPreview(user?.avatar_url || null);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  const initials = user?.name?.charAt(0)?.toUpperCase() || '?';
  const isWorker = user?.mode === 'worker';
  const gradient = isWorker
    ? 'from-worker to-amber-400'
    : 'from-client to-violet-400';

  return (
    <div className="relative group w-20 h-20 flex-shrink-0">
      {/* Avatar */}
      <div className={`w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-3xl font-black border-2 border-white shadow-md`}>
        {preview ? (
          <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {/* Overlay ao hover */}
      <button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer"
      >
        {loading ? (
          <Icon name="refresh" size={20} color="#fff" className="animate-spin" />
        ) : (
          <Icon name="camera" size={20} color="#fff" />
        )}
      </button>

      {/* Badge de câmera */}
      <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-white rounded-full border border-slate-200 flex items-center justify-center text-xs shadow-sm pointer-events-none">
        <Icon name="camera" size={12} color="#64748B" />
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
