-- Migração 021: renomeia tabelas e colunas para português sem apagar dados.
DO $$
DECLARE
  tabela RECORD;
  coluna RECORD;
BEGIN
  IF to_regclass('public.users') IS NOT NULL AND to_regclass('public.usuarios') IS NULL THEN
    ALTER TABLE public.users RENAME TO usuarios;
  END IF;
  IF to_regclass('public.categories') IS NOT NULL AND to_regclass('public.categorias') IS NULL THEN
    ALTER TABLE public.categories RENAME TO categorias;
  END IF;
  IF to_regclass('public.services') IS NOT NULL AND to_regclass('public.servicos') IS NULL THEN
    ALTER TABLE public.services RENAME TO servicos;
  END IF;
  IF to_regclass('public.orders') IS NOT NULL AND to_regclass('public.pedidos') IS NULL THEN
    ALTER TABLE public.orders RENAME TO pedidos;
  END IF;
  IF to_regclass('public.reviews') IS NOT NULL AND to_regclass('public.avaliacoes') IS NULL THEN
    ALTER TABLE public.reviews RENAME TO avaliacoes;
  END IF;
  IF to_regclass('public.chat_messages') IS NOT NULL AND to_regclass('public.mensagens_chat') IS NULL THEN
    ALTER TABLE public.chat_messages RENAME TO mensagens_chat;
  END IF;
  IF to_regclass('public.points_history') IS NOT NULL AND to_regclass('public.historico_pontos') IS NULL THEN
    ALTER TABLE public.points_history RENAME TO historico_pontos;
  END IF;
  IF to_regclass('public.portfolio_photos') IS NOT NULL AND to_regclass('public.fotos_portfolio') IS NULL THEN
    ALTER TABLE public.portfolio_photos RENAME TO fotos_portfolio;
  END IF;
  IF to_regclass('public.availability_slots') IS NOT NULL AND to_regclass('public.horarios_disponibilidade') IS NULL THEN
    ALTER TABLE public.availability_slots RENAME TO horarios_disponibilidade;
  END IF;
  IF to_regclass('public.quotes') IS NOT NULL AND to_regclass('public.orcamentos') IS NULL THEN
    ALTER TABLE public.quotes RENAME TO orcamentos;
  END IF;
  IF to_regclass('public.quote_proposals') IS NOT NULL AND to_regclass('public.propostas_orcamento') IS NULL THEN
    ALTER TABLE public.quote_proposals RENAME TO propostas_orcamento;
  END IF;
  IF to_regclass('public.payments') IS NOT NULL AND to_regclass('public.pagamentos') IS NULL THEN
    ALTER TABLE public.payments RENAME TO pagamentos;
  END IF;
  IF to_regclass('public.favorites') IS NOT NULL AND to_regclass('public.favoritos') IS NULL THEN
    ALTER TABLE public.favorites RENAME TO favoritos;
  END IF;
  IF to_regclass('public.order_status_history') IS NOT NULL AND to_regclass('public.historico_status_pedido') IS NULL THEN
    ALTER TABLE public.order_status_history RENAME TO historico_status_pedido;
  END IF;
  IF to_regclass('public.addresses') IS NOT NULL AND to_regclass('public.enderecos') IS NULL THEN
    ALTER TABLE public.addresses RENAME TO enderecos;
  END IF;
  IF to_regclass('public.shorts') IS NOT NULL AND to_regclass('public.publicacoes') IS NULL THEN
    ALTER TABLE public.shorts RENAME TO publicacoes;
  END IF;
  IF to_regclass('public.short_comments') IS NOT NULL AND to_regclass('public.comentarios_publicacao') IS NULL THEN
    ALTER TABLE public.short_comments RENAME TO comentarios_publicacao;
  END IF;
  IF to_regclass('public.short_likes') IS NOT NULL AND to_regclass('public.curtidas_publicacao') IS NULL THEN
    ALTER TABLE public.short_likes RENAME TO curtidas_publicacao;
  END IF;
  IF to_regclass('public.short_saves') IS NOT NULL AND to_regclass('public.salvos_publicacao') IS NULL THEN
    ALTER TABLE public.short_saves RENAME TO salvos_publicacao;
  END IF;
  IF to_regclass('public.conversations') IS NOT NULL AND to_regclass('public.conversas') IS NULL THEN
    ALTER TABLE public.conversations RENAME TO conversas;
  END IF;
  IF to_regclass('public.worker_profiles') IS NOT NULL AND to_regclass('public.perfis_trabalhador') IS NULL THEN
    ALTER TABLE public.worker_profiles RENAME TO perfis_trabalhador;
  END IF;
  IF to_regclass('public.worker_service_areas') IS NOT NULL AND to_regclass('public.areas_atendimento') IS NULL THEN
    ALTER TABLE public.worker_service_areas RENAME TO areas_atendimento;
  END IF;
  IF to_regclass('public.legal_guardians') IS NOT NULL AND to_regclass('public.responsaveis_legais') IS NULL THEN
    ALTER TABLE public.legal_guardians RENAME TO responsaveis_legais;
  END IF;
  IF to_regclass('public.media_files') IS NOT NULL AND to_regclass('public.arquivos_midia') IS NULL THEN
    ALTER TABLE public.media_files RENAME TO arquivos_midia;
  END IF;
  IF to_regclass('public.short_views') IS NOT NULL AND to_regclass('public.visualizacoes_publicacao') IS NULL THEN
    ALTER TABLE public.short_views RENAME TO visualizacoes_publicacao;
  END IF;
  IF to_regclass('public.short_media') IS NOT NULL AND to_regclass('public.midia_publicacao') IS NULL THEN
    ALTER TABLE public.short_media RENAME TO midia_publicacao;
  END IF;
  IF to_regclass('public.platform_settings') IS NOT NULL AND to_regclass('public.configuracoes_plataforma') IS NULL THEN
    ALTER TABLE public.platform_settings RENAME TO configuracoes_plataforma;
  END IF;
  IF to_regclass('public.subscription_plans') IS NOT NULL AND to_regclass('public.planos_assinatura') IS NULL THEN
    ALTER TABLE public.subscription_plans RENAME TO planos_assinatura;
  END IF;
  IF to_regclass('public.subscriptions') IS NOT NULL AND to_regclass('public.assinaturas') IS NULL THEN
    ALTER TABLE public.subscriptions RENAME TO assinaturas;
  END IF;
  IF to_regclass('public.payment_transactions') IS NOT NULL AND to_regclass('public.transacoes_pagamento') IS NULL THEN
    ALTER TABLE public.payment_transactions RENAME TO transacoes_pagamento;
  END IF;
  IF to_regclass('public.service_transactions') IS NOT NULL AND to_regclass('public.transacoes_servico') IS NULL THEN
    ALTER TABLE public.service_transactions RENAME TO transacoes_servico;
  END IF;
  IF to_regclass('public.platform_commissions') IS NOT NULL AND to_regclass('public.comissoes_plataforma') IS NULL THEN
    ALTER TABLE public.platform_commissions RENAME TO comissoes_plataforma;
  END IF;
  IF to_regclass('public.payment_webhook_events') IS NOT NULL AND to_regclass('public.eventos_webhook_pagamento') IS NULL THEN
    ALTER TABLE public.payment_webhook_events RENAME TO eventos_webhook_pagamento;
  END IF;
  IF to_regclass('public.agenda_notes') IS NOT NULL AND to_regclass('public.notas_agenda') IS NULL THEN
    ALTER TABLE public.agenda_notes RENAME TO notas_agenda;
  END IF;
  FOR tabela IN SELECT * FROM (VALUES ('usuarios'), ('categorias'), ('servicos'), ('pedidos'), ('avaliacoes'), ('mensagens_chat'), ('historico_pontos'), ('fotos_portfolio'), ('horarios_disponibilidade'), ('orcamentos'), ('propostas_orcamento'), ('pagamentos'), ('favoritos'), ('historico_status_pedido'), ('enderecos'), ('publicacoes'), ('comentarios_publicacao'), ('curtidas_publicacao'), ('salvos_publicacao'), ('conversas'), ('perfis_trabalhador'), ('areas_atendimento'), ('responsaveis_legais'), ('arquivos_midia'), ('visualizacoes_publicacao'), ('midia_publicacao'), ('configuracoes_plataforma'), ('planos_assinatura'), ('assinaturas'), ('transacoes_pagamento'), ('transacoes_servico'), ('comissoes_plataforma'), ('eventos_webhook_pagamento'), ('notas_agenda')) AS lista(nome) LOOP
    FOR coluna IN SELECT * FROM (VALUES ('user_id','usuario_id'), ('worker_id','trabalhador_id'), ('client_id','cliente_id'), ('order_id','pedido_id'), ('service_id','servico_id'), ('category_id','categoria_id'), ('category_slug','categoria_slug'), ('quote_id','orcamento_id'), ('short_id','publicacao_id'), ('conversation_id','conversa_id'), ('sender_id','remetente_id'), ('owner_id','dono_id'), ('payer_id','pagador_id'), ('payee_id','recebedor_id'), ('payment_transaction_id','transacao_pagamento_id'), ('service_transaction_id','transacao_servico_id'), ('subscription_id','assinatura_id'), ('plan_id','plano_id'), ('address_id','endereco_id'), ('address_number','numero_endereco'), ('address_complement','complemento_endereco'), ('created_at','criado_em'), ('updated_at','atualizado_em'), ('completed_at','concluido_em'), ('cancelled_at','cancelado_em'), ('started_at','iniciado_em'), ('scheduled_at','agendado_para'), ('expires_at','expira_em'), ('released_at','liberado_em'), ('paid_at','pago_em'), ('last_message_at','ultima_mensagem_em'), ('current_period_end','fim_periodo_atual'), ('plan_expires_at','plano_expira_em'), ('birth_date','data_nascimento'), ('cpf_status','estado_cpf'), ('cpf_checked_at','cpf_verificado_em'), ('terms_accepted_at','termos_aceitos_em'), ('terms_version','versao_termos'), ('password_hash','hash_senha'), ('avatar_url','url_avatar'), ('public_url','url_publica'), ('thumbnail_url','url_miniatura'), ('storage_path','caminho_armazenamento'), ('media_type','tipo_midia'), ('mime_type','tipo_mime'), ('is_client','eh_cliente'), ('is_worker','eh_trabalhador'), ('is_verified','eh_verificado'), ('is_available','esta_disponivel'), ('is_active','esta_ativo'), ('is_complete','esta_completo'), ('is_read','foi_lido'), ('is_public','eh_publico'), ('is_liked','foi_curtido'), ('is_saved','foi_salvo'), ('is_boosted','foi_impulsionado'), ('account_type','tipo_conta'), ('wallet_balance','saldo_carteira'), ('response_time_avg','media_tempo_resposta'), ('avg_rating','media_avaliacao'), ('total_orders','total_pedidos'), ('total_reviews','total_avaliacoes'), ('total_likes','total_curtidas'), ('total_comments','total_comentarios'), ('total_views','total_visualizacoes'), ('total_saves','total_salvos'), ('price_min','preco_minimo'), ('price_max','preco_max'), ('price_type','tipo_preco'), ('budget_max','orcamento_maximo'), ('service_area','area_servico'), ('service_areas','areas_servico'), ('availability_days','dias_disponibilidade'), ('availability_note','observacao_disponibilidade'), ('hour_start','hora_inicio'), ('hour_end','hora_fim'), ('note_date','data_anotacao'), ('cancel_reason','motivo_cancelamento'), ('status_detail','detalhe_estado'), ('custom_category_text','texto_categoria_personalizada'), ('category_name','nome_categoria'), ('category_icon','icone_categoria'), ('worker_name','nome_trabalhador'), ('worker_email','email_trabalhador'), ('worker_phone','telefone_trabalhador'), ('worker_avatar_url','url_avatar_trabalhador'), ('client_name','nome_cliente'), ('client_email','email_cliente'), ('client_avatar_url','url_avatar_cliente'), ('client_neighborhood','bairro_cliente'), ('worker_description','descricao_trabalhador'), ('plan_name','nome_plano'), ('plan_badge','selo_plano'), ('plan_slug','slug_plano'), ('has_guardian','tem_responsavel'), ('has_worker_profile','tem_perfil_trabalhador'), ('has_stats','tem_estatisticas'), ('has_advanced_stats','tem_estatisticas_avancadas'), ('payment_method_id','metodo_pagamento_id'), ('payment_provider_id','provedor_pagamento_id'), ('provider_reference','referencia_provedor'), ('provider_payment_id','pagamento_provedor_id'), ('external_reference','referencia_externa'), ('provider_payload','dados_provedor'), ('pix_payload','dados_pix'), ('gross_amount','valor_bruto'), ('net_amount','valor_liquido'), ('platform_fee','taxa_plataforma'), ('fee_percent','percentual_taxa'), ('commission_percent','percentual_comissao'), ('transaction_amount','valor_transacao'), ('billing_period','periodo_cobranca'), ('auto_renew','renovacao_automatica'), ('exposure_weight','peso_exposicao'), ('quote_boost_price','preco_impulso_orcamento'), ('quote_boost_days','dias_impulso_orcamento'), ('boosted_at','impulsionado_em'), ('boost_expires_at','impulso_expira_em'), ('likes_count','quantidade_curtidas'), ('comments_count','quantidade_comentarios'), ('views_count','quantidade_visualizacoes'), ('saves_count','quantidade_salvos'), ('unread_count','quantidade_nao_lidas'), ('other_user_id','outro_usuario_id'), ('other_name','outro_nome'), ('other_avatar_url','url_avatar_outro'), ('other_is_worker','outro_eh_trabalhador'), ('reviewer_id','avaliador_id'), ('reviewed_id','avaliado_id'), ('reviewer_name','nome_avaliador'), ('reviewer_avatar_url','url_avatar_avaliador'), ('reviewed_name','nome_avaliado'), ('reviewed_avatar_url','url_avatar_avaliado'), ('order_status','estado_pedido'), ('service_title','titulo_servico'), ('status','estado'), ('message','mensagem'), ('content','conteudo'), ('description','descricao'), ('title','titulo'), ('name','nome'), ('phone','telefone'), ('city','cidade'), ('neighborhood','bairro'), ('street','rua'), ('region','regiao'), ('radius_km','raio_km'), ('points','pontos'), ('amount','quantidade'), ('type','tipo'), ('mode','modo'), ('icon','icone'), ('sort_order','ordem_exibicao'), ('size_bytes','tamanho_bytes'), ('duration_seconds','duracao_segundos'), ('access_token','token_acesso'), ('refresh_token','token_atualizacao'), ('password','senha')) AS lista(antiga,nova) LOOP
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=tabela.nome AND column_name=coluna.antiga)
         AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=tabela.nome AND column_name=coluna.nova) THEN
        EXECUTE format('ALTER TABLE public.%I RENAME COLUMN %I TO %I', tabela.nome, coluna.antiga, coluna.nova);
      END IF;
    END LOOP;
  END LOOP;
END $$;
