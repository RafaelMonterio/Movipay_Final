-- ============================================================
-- atualizar_estatisticas_usuario.sql
-- Recalcula as estatísticas dos usuários do MoviPay
-- Compatível com a tabela portuguesa public.usuarios
-- ============================================================

-- Garante que as colunas de estatísticas existam.
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS media_avaliacao NUMERIC(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_pedidos INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_avaliacoes INTEGER DEFAULT 0;

-- Remove a versão anterior para permitir a alteração do nome
-- do parâmetro da função sem erro 42P13.
DROP FUNCTION IF EXISTS public.atualizar_estatisticas_usuario(INTEGER);

-- Cria a função principal.
CREATE FUNCTION public.atualizar_estatisticas_usuario(
  p_usuario_id INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.usuarios
  SET
    media_avaliacao = (
      SELECT COALESCE(
        ROUND(AVG(a.rating)::NUMERIC, 2),
        0
      )
      FROM public.avaliacoes AS a
      WHERE a.avaliado_id = p_usuario_id
    ),

    total_avaliacoes = (
      SELECT COUNT(*)::INTEGER
      FROM public.avaliacoes AS a
      WHERE a.avaliado_id = p_usuario_id
    ),

    total_pedidos = (
      SELECT COUNT(*)::INTEGER
      FROM public.pedidos AS p
      WHERE (
        p.cliente_id = p_usuario_id
        OR p.trabalhador_id = p_usuario_id
      )
      AND p.estado = 'completed'
    ),

    atualizado_em = NOW()

  WHERE id = p_usuario_id;
END;
$$;

COMMENT ON FUNCTION public.atualizar_estatisticas_usuario(INTEGER)
IS
'Recalcula a média de avaliações, o total de avaliações e o total de pedidos concluídos do usuário.';


-- ============================================================
-- Alias de compatibilidade
-- ============================================================

DROP FUNCTION IF EXISTS public.update_user_stats(INTEGER);

CREATE FUNCTION public.update_user_stats(
  p_usuario_id INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.atualizar_estatisticas_usuario(p_usuario_id);
END;
$$;

COMMENT ON FUNCTION public.update_user_stats(INTEGER)
IS
'Alias de compatibilidade para atualizar_estatisticas_usuario.';


-- ============================================================
-- Atualiza as estatísticas dos trabalhadores existentes
-- ============================================================

SELECT public.atualizar_estatisticas_usuario(u.id)
FROM public.usuarios AS u
WHERE u.modo = 'worker';
