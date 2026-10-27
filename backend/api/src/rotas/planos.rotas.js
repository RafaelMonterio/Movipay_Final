const { Router } = require('express');
const { consultarBanco, obterClienteBanco } = require('../banco/conexao');
const { intermediarioAutenticacao, SECRET } = require('../intermediarios/autenticacao');
const { lidarAssincrono } = require('../intermediarios/lidarAssincrono');
const { ErroApi, assert } = require('../intermediarios/tratamentoErros');
const { obterProvedor, descreverConfiguracao } = require('../servicos/pagamentos');
const { aplicarEstadoPagamento } = require('../servicos/processamentoPagamentos');

const router = Router();

/** * Planos premium dos trabalhadores. O ponto central: assinar NÃO ativa o plano. `POST /planos/:slug/assinar` cria a assinatura como `pending` e gera a cobrança; o plano só vira... */

/** GET /api/v1/planos — os três planos + o plano atual do usuário. */
router.get(
  '/',
  lidarAssincrono(async (req, res) => {
    const { rows } = await consultarBanco(
      `SELECT id, slug, nome, tagline, price, currency, periodo_cobranca, peso_exposicao,
              features, badge_label, tem_estatisticas, tem_estatisticas_avancadas, ordem_exibicao
       FROM planos_assinatura WHERE esta_ativo = TRUE ORDER BY ordem_exibicao`
    );

    let current = null;
    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const payload = jwt.verify(header.split(' ')[1], SECRET);
        const me = await consultarBanco(
          `SELECT u.slug_plano, u.plano_expira_em, s.id AS assinatura_id, s.estado, s.renovacao_automatica
           FROM usuarios u
           LEFT JOIN assinaturas s ON s.usuario_id = u.id AND s.estado = 'active'
           WHERE u.id = $1`,
          [payload.id]
        );
        current = me.rows[0] || null;
      } catch {
        /* visitante — segue sem plano atual */
      }
    }

    const config = descreverConfiguracao();
    res.json({
      planos: rows,
      current,
      pagamento: { provider: config.provider, configured: config.configured, supportsRecurring: config.supportsRecurring },
    });
  })
);

/** GET /api/v1/planos/me — assinatura ativa e histórico do usuário. */
router.get(
  '/me',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const active = await consultarBanco(
      `SELECT s.id, s.estado, s.renovacao_automatica, s.iniciado_em, s.fim_periodo_atual, s.provider,
              p.slug, p.nome, p.price, p.badge_label, p.peso_exposicao,
              p.tem_estatisticas, p.tem_estatisticas_avancadas, p.features
       FROM assinaturas s JOIN planos_assinatura p ON p.id = s.plano_id
       WHERE s.usuario_id = $1 AND s.estado = 'active' LIMIT 1`,
      [req.usuario.id]
    );

    const history = await consultarBanco(
      `SELECT s.id, s.estado, s.iniciado_em, s.fim_periodo_atual, s.cancelado_em, s.criado_em,
              p.nome AS nome_plano, p.price
       FROM assinaturas s JOIN planos_assinatura p ON p.id = s.plano_id
       WHERE s.usuario_id = $1 ORDER BY s.criado_em DESC LIMIT 30`,
      [req.usuario.id]
    );

    const pagamentos = await consultarBanco(
      `SELECT pt.id, pt.estado, pt.valor_bruto, pt.method, pt.pago_em, pt.criado_em, p.nome AS nome_plano
       FROM transacoes_pagamento pt
       JOIN assinaturas s ON s.id = pt.assinatura_id
       JOIN planos_assinatura p ON p.id = s.plano_id
       WHERE pt.pagador_id = $1 AND pt.kind = 'subscription'
       ORDER BY pt.criado_em DESC LIMIT 30`,
      [req.usuario.id]
    );

    const user = await consultarBanco('SELECT slug_plano, plano_expira_em FROM usuarios WHERE id = $1', [req.usuario.id]);

    res.json({
      planSlug: user.rows[0]?.slug_plano || 'formiga',
      planExpiresAt: user.rows[0]?.plano_expira_em || null,
      assinatura: active.rows[0] || null,
      historico: history.rows,
      pagamentos: pagamentos.rows,
    });
  })
);

/** * POST /api/v1/planos/:slug/assinar body: { method?: 'pix'|'recurring' } Cria a assinatura PENDENTE e a cobrança. Devolve o Pix (copia e cola + QR) ou, no modo recorrente, o li... */
router.post(
  '/:slug/assinar',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const me = await consultarBanco('SELECT id, nome, email, cpf, eh_trabalhador, slug_plano FROM usuarios WHERE id = $1', [
      req.usuario.id,
    ]);
    const user = me.rows[0];
    assert(user?.eh_trabalhador, 403, 'Os planos premium são para contas com perfil de trabalhador.');

    const planRes = await consultarBanco('SELECT * FROM planos_assinatura WHERE slug = $1 AND esta_ativo = TRUE', [
      req.params.slug,
    ]);
    const plan = planRes.rows[0];
    if (!plan) throw new ErroApi(404, 'Plano não encontrado.');

    // ---- Formiga é gratuito: cancela o pago e volta ao básico ----
    if (Number(plan.price) === 0) {
      const conn = await obterClienteBanco();
      try {
        await conn.consultarBanco('BEGIN');
        await conn.consultarBanco(
          `UPDATE assinaturas SET estado = 'cancelled', cancelado_em = NOW(), atualizado_em = NOW()
           WHERE usuario_id = $1 AND estado IN ('active','pending')`,
          [req.usuario.id]
        );
        await conn.consultarBanco(`UPDATE usuarios SET slug_plano = 'formiga', plano_expira_em = NULL WHERE id = $1`, [
          req.usuario.id,
        ]);
        await conn.consultarBanco('COMMIT');
      } catch (err) {
        await conn.consultarBanco('ROLLBACK');
        throw err;
      } finally {
        conn.release();
      }
      return res.json({ planSlug: 'formiga', free: true, mensagem: 'Você está no plano Formiga (gratuito).' });
    }

    assert(user.slug_plano !== plan.slug, 409, `Você já está no plano ${plan.nome}.`);

    const provider = obterProvedor();
    if (!provider.isConfigured()) {
      const cfg = descreverConfiguracao();
      throw new ErroApi(
        503,
        `Assinatura indisponível: falta configurar ${cfg.missingEnv.join(', ') || 'as credenciais do gateway'} no .env do backend.`,
        { code: 'PAYMENT_NOT_CONFIGURED', missingEnv: cfg.missingEnv }
      );
    }

    const recurring = req.body.method === 'recurring';
    if (recurring && !provider.supportsRecurring) {
      throw new ErroApi(400, `O provedor ${provider.label} não oferece cobrança recorrente automática.`);
    }

    // ---- Assinatura pendente ----
    const subRes = await consultarBanco(
      `INSERT INTO assinaturas (usuario_id, plano_id, estado, provider, renovacao_automatica)
       VALUES ($1,$2,'pending',$3,$4) RETURNING *`,
      [req.usuario.id, plan.id, provider.id, recurring]
    );
    const subscription = subRes.rows[0];

    // ---- Caminho recorrente: link de autorização ----
    if (recurring) {
      let pre;
      try {
        pre = await provider.createSubscription({
          planName: `MoviPay ${plan.nome}`,
          quantidade: plan.price,
          payerEmail: user.email,
          externalReference: `sub-${subscription.id}`,
        });
      } catch (err) {
        await consultarBanco(`UPDATE assinaturas SET estado = 'cancelled' WHERE id = $1`, [subscription.id]);
        throw new ErroApi(502, `Não foi possível criar a assinatura: ${(err.mensagem || err.message)}`);
      }
      await consultarBanco(`UPDATE assinaturas SET referencia_provedor = $1, atualizado_em = NOW() WHERE id = $2`, [
        pre.providerReference,
        subscription.id,
      ]);
      return res.status(201).json({
        subscriptionId: subscription.id,
        recurring: true,
        authorizationUrl: pre.initPoint,
        mensagem: 'Abra o link para autorizar a cobrança mensal. O plano é ativado após a confirmação.',
      });
    }

    // ---- Caminho Pix avulso (30 dias) ----
    const txRes = await consultarBanco(
      `INSERT INTO transacoes_pagamento
         (kind, pagador_id, assinatura_id, provider, method,
          valor_bruto, taxa_plataforma, valor_liquido, percentual_taxa, estado)
       VALUES ('subscription',$1,$2,$3,'pix',$4,$4,0,100,'pending')
       RETURNING id`,
      [req.usuario.id, subscription.id, provider.id, plan.price]
    );
    const txId = txRes.rows[0].id;

    let charge;
    try {
      charge = await provider.createPixPayment({
        quantidade: plan.price,
        descricao: `MoviPay · Plano ${plan.nome} (30 dias)`,
        payer: { nome: user.nome, email: user.email, cpf: user.cpf },
        externalReference: `sub-${txId}`,
      });
    } catch (err) {
      await consultarBanco(
        `UPDATE transacoes_pagamento SET estado = 'rejected', detalhe_estado = $1 WHERE id = $2`,
        [String((err.mensagem || err.message)).slice(0, 500), txId]
      );
      await consultarBanco(`UPDATE assinaturas SET estado = 'cancelled' WHERE id = $1`, [subscription.id]);
      if (err.missingCredentials) throw new ErroApi(503, (err.mensagem || err.message), { code: 'PAYMENT_NOT_CONFIGURED' });
      throw new ErroApi(502, `Não foi possível gerar a cobrança: ${(err.mensagem || err.message)}`);
    }

    const { rows } = await consultarBanco(
      `UPDATE transacoes_pagamento SET
         pagamento_provedor_id = $1, estado = $2, detalhe_estado = $3,
         dados_pix = $4, pix_qr_base64 = $5, ticket_url = $6,
         expira_em = $7, dados_provedor = $8, atualizado_em = NOW()
       WHERE id = $9 RETURNING *`,
      [
        charge.providerPaymentId,
        charge.estado,
        charge.statusDetail,
        charge.pixPayload,
        charge.pixQrBase64,
        charge.ticketUrl,
        charge.expiresAt,
        charge.raw ? JSON.stringify(charge.raw) : null,
        txId,
      ]
    );

    res.status(201).json({
      subscriptionId: subscription.id,
      pagamento: rows[0],
      plano: { slug: plan.slug, nome: plan.nome, price: plan.price },
    });
  })
);

/** POST /api/v1/planos/cancelar — cancela a assinatura ativa. */
router.post(
  '/cancelar',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const active = await consultarBanco(
      `SELECT s.*, p.nome FROM assinaturas s JOIN planos_assinatura p ON p.id = s.plano_id
       WHERE s.usuario_id = $1 AND s.estado = 'active' LIMIT 1`,
      [req.usuario.id]
    );
    const sub = active.rows[0];
    if (!sub) throw new ErroApi(404, 'Você não tem assinatura ativa.');

    // Se era recorrente, avisa o provedor para parar de cobrar.
    if (sub.renovacao_automatica && sub.referencia_provedor) {
      try {
        await obterProvedor(sub.provider).cancelSubscription(sub.referencia_provedor);
      } catch (err) {
        console.warn('[plans] falha ao cancelar no provedor:', (err.mensagem || err.message));
      }
    }

    await consultarBanco(
      `UPDATE assinaturas SET estado = 'cancelled', cancelado_em = NOW(), renovacao_automatica = FALSE, atualizado_em = NOW()
       WHERE id = $1`,
      [sub.id]
    );
    // O período já pago continua valendo até o fim — não se tira o que a pessoa pagou. `plano_expira_em` é quem devolve ao Formiga depois (rotina expireO...
    res.json({
      cancelled: true,
      validUntil: sub.fim_periodo_atual,
      mensagem: `Assinatura ${sub.nome} cancelada. Os benefícios valem até ${new Date(sub.fim_periodo_atual).toLocaleDateString('pt-BR')}.`,
    });
  })
);

/** * GET /api/v1/planos/estatisticas — estatísticas do trabalhador. O nível de detalhe depende do plano: Formiga não tem, Operária tem o básico, Rainha tem o completo dos Shorts. */
router.get(
  '/estatisticas',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const me = await consultarBanco(
      `SELECT u.eh_trabalhador, u.slug_plano, p.tem_estatisticas, p.tem_estatisticas_avancadas, p.nome AS nome_plano
       FROM usuarios u LEFT JOIN planos_assinatura p ON p.slug = u.slug_plano WHERE u.id = $1`,
      [req.usuario.id]
    );
    const user = me.rows[0];
    assert(user?.eh_trabalhador, 403, 'Estatísticas são do perfil de trabalhador.');

    if (!user.tem_estatisticas) {
      return res.json({
        available: false,
        planSlug: user.slug_plano,
        mensagem: 'Assine o plano Operária ou Rainha para ver as estatísticas do seu perfil.',
      });
    }

    const basic = await consultarBanco(
      `SELECT COALESCE(u.total_pedidos,0)::int AS total_pedidos,
              COALESCE(u.total_avaliacoes,0)::int AS total_avaliacoes,
              COALESCE(u.media_avaliacao,0) AS media_avaliacao,
              (SELECT COUNT(*) FROM favoritos f WHERE f.trabalhador_id = u.id)::int AS favoritos,
              (SELECT COUNT(*) FROM conversas c WHERE c.trabalhador_id = u.id)::int AS conversas
       FROM usuarios u WHERE u.id = $1`,
      [req.usuario.id]
    );

    const payload = {
      available: true,
      planSlug: user.slug_plano,
      planName: user.nome_plano,
      basic: basic.rows[0],
    };

    if (user.tem_estatisticas_avancadas) {
      const publicacoes = await consultarBanco('SELECT * FROM worker_shorts_stats WHERE trabalhador_id = $1', [req.usuario.id]);
      const perShort = await consultarBanco(
        `SELECT s.id, s.tipo_midia, s.caption, s.quantidade_visualizacoes, s.criado_em,
                (SELECT COUNT(*) FROM curtidas_publicacao l WHERE l.publicacao_id = s.id)::int AS likes,
                (SELECT COUNT(*) FROM comentarios_publicacao c WHERE c.publicacao_id = s.id)::int AS comments,
                (SELECT COUNT(*) FROM salvos_publicacao sv WHERE sv.publicacao_id = s.id)::int AS saves
         FROM publicacoes s WHERE s.trabalhador_id = $1 ORDER BY s.quantidade_visualizacoes DESC LIMIT 20`,
        [req.usuario.id]
      );
      payload.publicacoes = publicacoes.rows[0] || {
        total_shorts: 0,
        total_visualizacoes: 0,
        total_curtidas: 0,
        total_comentarios: 0,
        total_salvos: 0,
      };
      payload.topShorts = perShort.rows;

      const earnings = await consultarBanco(
        `SELECT COALESCE(SUM(valor_bruto),0) AS gross,
                COALESCE(SUM(taxa_plataforma),0) AS fees,
                COALESCE(SUM(valor_liquido),0) AS net,
                COUNT(*)::int AS servicos
         FROM transacoes_servico WHERE trabalhador_id = $1 AND estado IN ('paid','released')`,
        [req.usuario.id]
      );
      payload.earnings = earnings.rows[0];
    }

    res.json(payload);
  })
);

/** * POST /api/v1/planos/webhook/mercadopago-subscription Eventos de preapproval (assinatura recorrente autorizada/cancelarada). */
router.post(
  '/webhook/mercadopago-subscription',
  lidarAssincrono(async (req, res) => {
    const provider = obterProvedor('mercadopago');
    const dataId = req.body?.data?.id || req.query['data.id'] || req.query.id;
    const eventType = req.body?.tipo || req.body?.action || req.query.topic || 'unknown';
    if (!dataId) return res.status(200).json({ ignored: true });

    const verification = provider.verifyWebhookSignature({
      signatureHeader: req.headers['x-signature'],
      requestId: req.headers['x-request-id'],
      dataId,
    });
    if (!verification.ok) {
      return res.status(401).json({ error: { mensagem: 'Assinatura do webhook inválida.' } });
    }

    const inserted = await consultarBanco(
      `INSERT INTO eventos_webhook_pagamento (provider, event_id, event_type, payload)
       VALUES ('mercadopago',$1,$2,$3) ON CONFLICT (provider, event_id) DO NOTHING RETURNING id`,
      [`preapproval:${dataId}`, String(eventType).slice(0, 60), JSON.stringify(req.body || {})]
    );
    if (!inserted.rows[0]) return res.status(200).json({ duplicated: true });

    try {
      const remote = await provider.getSubscription(dataId);
      const local = await consultarBanco(`SELECT id, usuario_id FROM assinaturas WHERE referencia_provedor = $1`, [
        String(dataId),
      ]);
      if (local.rows[0] && remote) {
        if (remote.estado === 'active') {
          const conn = await obterClienteBanco();
          try {
            await conn.consultarBanco('BEGIN');
            const { ativarAssinatura } = require('../servicos/processamentoPagamentos');
            await ativarAssinatura(conn, local.rows[0].id);
            await conn.consultarBanco('COMMIT');
          } catch (e) {
            await conn.consultarBanco('ROLLBACK');
            throw e;
          } finally {
            conn.release();
          }
        } else if (remote.estado === 'cancelled') {
          await consultarBanco(
            `UPDATE assinaturas SET estado = 'cancelled', cancelado_em = NOW() WHERE id = $1`,
            [local.rows[0].id]
          );
          await consultarBanco(`UPDATE usuarios SET slug_plano = 'formiga', plano_expira_em = NULL WHERE id = $1`, [
            local.rows[0].usuario_id,
          ]);
        }
      }
    } catch (err) {
      console.error('[plans/webhook]', (err.mensagem || err.message));
    }

    res.status(200).json({ received: true });
  })
);

module.exports = router;
