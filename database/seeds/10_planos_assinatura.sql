-- ============================================================
-- 10_subscription_plans.sql
-- Os três planos do MoviPay. Idempotente (ON CONFLICT), então pode
-- rodar quantas vezes quiser sem duplicar.
--
-- peso_exposicao é o multiplicador de relevância na busca. Ele é
-- limitado de propósito (máx. 2.00): o plano aumenta a chance de
-- aparecer, mas nunca joga um profissional irrelevante para o topo.
-- ============================================================

INSERT INTO planos_assinatura
  (slug, nome, tagline, price, peso_exposicao, badge_label, tem_estatisticas, tem_estatisticas_avancadas, ordem_exibicao, features)
VALUES
  (
    'formiga',
    'Formiga',
    'Tudo o que você precisa para começar a receber clientes.',
    0.00,
    1.00,
    NULL,
    FALSE,
    FALSE,
    1,
    '[
      "Perfil profissional completo",
      "Publicação de Shorts (fotos e vídeos)",
      "Aparecer nas buscas normais",
      "Receber contatos de clientes",
      "Chat com clientes",
      "Recursos básicos da plataforma"
    ]'::jsonb
  ),
  (
    'operaria',
    'Operária',
    'Mais visibilidade e números para crescer.',
    19.90,
    1.35,
    'Operária',
    TRUE,
    FALSE,
    2,
    '[
      "Tudo do plano Formiga",
      "Maior exposição nas buscas",
      "Perfil com destaque visual",
      "Prioridade na exibição de profissionais",
      "Estatísticas básicas de perfil e publicações",
      "Destaque dentro da sua categoria",
      "Mais ferramentas de divulgação"
    ]'::jsonb
  ),
  (
    'rainha',
    'Rainha',
    'Exposição máxima e estatísticas avançadas.',
    39.90,
    1.70,
    'Rainha',
    TRUE,
    TRUE,
    3,
    '[
      "Tudo do plano Operária",
      "Exposição máxima permitida pela plataforma",
      "Maior destaque nas buscas",
      "Perfil destacado e selo de plano premium",
      "Destaque nas categorias",
      "Estatísticas avançadas de perfil",
      "Estatísticas completas dos Shorts (views, curtidas, salvos)",
      "Recursos avançados de divulgação",
      "Prioridade de exibição nas áreas adequadas da plataforma"
    ]'::jsonb
  )
ON CONFLICT (slug) DO UPDATE SET
  nome               = EXCLUDED.nome,
  tagline            = EXCLUDED.tagline,
  price              = EXCLUDED.price,
  peso_exposicao    = EXCLUDED.peso_exposicao,
  badge_label        = EXCLUDED.badge_label,
  tem_estatisticas          = EXCLUDED.tem_estatisticas,
  tem_estatisticas_avancadas = EXCLUDED.tem_estatisticas_avancadas,
  ordem_exibicao         = EXCLUDED.ordem_exibicao,
  features           = EXCLUDED.features;
