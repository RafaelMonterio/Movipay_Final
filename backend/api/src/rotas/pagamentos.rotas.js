const { Router } = require('express');
const { consultarBanco, obterClienteBanco } = require('../banco/conexao');
const { intermediarioAutenticacao } = require('../intermediarios/autenticacao');
const { lidarAssincrono } = require('../intermediarios/lidarAssincrono');
const { ErroApi, assert } = require('../intermediarios/tratamentoErros');
const { obterProvedor, descreverConfiguracao } = require('../servicos/pagamentos');
const { dividirComTaxaPlataforma, obterPercentualComissao } = require('../utilitarios/dinheiro');
const { aplicarEstadoPagamento } = require('../servicos/processamentoPagamentos');

const router = Router();

/** * Pagamentos do MoviPay. Princípio que vale para TODO este arquivo: um pagamento só vira `approved` quando o PROVEDOR diz que virou. O aplicativo não tem nenhum endpoint capaz d... */

/** GET /api/v1/pagamentos/configuracao — diagnóstico do gateway (sem expor segredo). */
router.get(
  '/configuracao',
  lidarAssincrono(async (req, res) => {
    const config = descreverConfiguracao();
    res.json({ ...config, commissionPercent: await obterPercentualComissao() });
  })
);

/** GET /api/v1/pagamentos/carteira — saldo e extrato do trabalhador (compatível com a tela Carteira). */
router.get(
  '/carteira',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const balance = await consultarBanco('SELECT saldo_carteira FROM usuarios WHERE id = $1', [req.usuario.id]);
    const held = await consultarBanco(
      `SELECT COALESCE(SUM(quantidade), 0) AS total FROM pagamentos WHERE recebedor_id = $1 AND estado = 'held'`,
      [req.usuario.id]
    );

    // Extrato antigo (escrow por pedido) — mantido para não quebrar a tela.
    const history = await consultarBanco(
      `SELECT p.id, p.pedido_id, p.quantidade, p.estado, p.held_at, p.liberado_em,
              o.anotacoes, cu.nome AS nome_cliente
       FROM pagamentos p
       JOIN pedidos o ON o.id = p.pedido_id
       JOIN usuarios cu ON cu.id = p.pagador_id
       WHERE p.recebedor_id = $1
       ORDER BY p.held_at DESC LIMIT 50`,
      [req.usuario.id]
    );

    // Novo: valores com a comissão já discriminada.
    const earnings = await consultarBanco(
      `SELECT st.id, st.pedido_id, st.valor_bruto, st.taxa_plataforma, st.valor_liquido,
              st.percentual_taxa, st.estado, st.criado_em, st.liberado_em,
              cu.nome AS nome_cliente, s.titulo AS titulo_servico
       FROM transacoes_servico st
       JOIN usuarios cu ON cu.id = st.cliente_id
       LEFT JOIN pedidos o ON o.id = st.pedido_id
       LEFT JOIN servicos s ON s.id = o.servico_id
       WHERE st.trabalhador_id = $1
       ORDER BY st.criado_em DESC LIMIT 50`,
      [req.usuario.id]
    );

    const totals = await consultarBanco(
      `SELECT COALESCE(SUM(valor_bruto),0) AS gross,
              COALESCE(SUM(taxa_plataforma),0) AS fees,
              COALESCE(SUM(valor_liquido),0)   AS net
       FROM transacoes_servico WHERE trabalhador_id = $1 AND estado IN ('paid','released')`,
      [req.usuario.id]
    );

    res.json({
      balance: Number(balance.rows[0]?.saldo_carteira || 0),
      pendingHeld: Number(held.rows[0]?.total || 0),
      historico: history.rows,
      earnings: earnings.rows,
      totals: {
        gross: Number(totals.rows[0]?.gross || 0),
        platformFees: Number(totals.rows[0]?.fees || 0),
        net: Number(totals.rows[0]?.net || 0),
      },
      commissionPercent: await obterPercentualComissao(),
    });
  })
);

/** GET /api/v1/pagamentos/historico — todas as cobranças do usuário logado. */
router.get(
  '/historico',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const { rows } = await consultarBanco(
      `SELECT pt.id, pt.kind, pt.method, pt.provider, pt.estado, pt.detalhe_estado,
              pt.valor_bruto, pt.taxa_plataforma, pt.valor_liquido, pt.percentual_taxa,
              pt.pedido_id, pt.assinatura_id, pt.expira_em, pt.pago_em, pt.criado_em,
              pl.nome AS nome_plano,
              payee.nome AS payee_name
       FROM transacoes_pagamento pt
       LEFT JOIN assinaturas sub ON sub.id = pt.assinatura_id
       LEFT JOIN planos_assinatura pl ON pl.id = sub.plano_id
       LEFT JOIN usuarios payee ON payee.id = pt.recebedor_id
       WHERE pt.pagador_id = $1 OR pt.recebedor_id = $1
       ORDER BY pt.criado_em DESC LIMIT 100`,
      [req.usuario.id]
    );
    res.json({ pagamentos: rows });
  })
);

/** * POST /api/v1/pagamentos/servico body: { pedido_id, method? } Cria a cobrança de um serviço. A comissão de 15% é calculada AQUI, no backend, a partir do preço gravado no pedido —... */
router.post(
  '/servico',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    assert(req.body.pedido_id, 400, 'Informe o pedido que está sendo pago.');

    const found = await consultarBanco(
      `SELECT o.id, o.cliente_id, o.trabalhador_id, o.price, o.estado, s.titulo AS titulo_servico
       FROM pedidos o LEFT JOIN servicos s ON s.id = o.servico_id
       WHERE o.id = $1`,
      [req.body.pedido_id]
    );
    const order = found.rows[0];
    if (!order) throw new ErroApi(404, 'Pedido não encontrado.');
    assert(order.cliente_id === req.usuario.id, 403, 'Somente o cliente do pedido pode pagá-lo.');
    assert(['pending', 'accepted', 'in_progress', 'completed'].includes(order.estado), 400,
      'Este pedido não está em um estado que permita pagamento.');
    assert(Number(order.price) > 0, 400, 'Este pedido não tem valor a cobrar.');

    // Já existe uma cobrança viva para este pedido? Devolve ela.
    const existing = await consultarBanco(
      `SELECT * FROM transacoes_pagamento
       WHERE pedido_id = $1 AND estado IN ('pending','approved')
       ORDER BY criado_em DESC LIMIT 1`,
      [order.id]
    );
    if (existing.rows[0] && existing.rows[0].estado === 'approved') {
      return res.json({ pagamento: existing.rows[0], alreadyPaid: true });
    }
    if (existing.rows[0] && new Date(existing.rows[0].expira_em) > new Date()) {
      return res.json({ pagamento: existing.rows[0], reused: true });
    }

    // ---- Comissão: calculada no backend, nunca no app ----
    const split = await dividirComTaxaPlataforma(order.price);

    const payer = await consultarBanco('SELECT nome, email, cpf FROM usuarios WHERE id = $1', [req.usuario.id]);
    const provider = obterProvedor();

    if (!provider.isConfigured()) {
      const cfg = descreverConfiguracao();
      throw new ErroApi(
        503,
        `Pagamento indisponível: falta configurar ${cfg.missingEnv.join(', ') || 'as credenciais do gateway'} no .env do backend.`,
        { code: 'PAYMENT_NOT_CONFIGURED', missingEnv: cfg.missingEnv }
      );
    }

    const conn = await obterClienteBanco();
    let txId;
    try {
      await conn.consultarBanco('BEGIN');

      const ins = await conn.consultarBanco(
        `INSERT INTO transacoes_pagamento
           (kind, pagador_id, recebedor_id, pedido_id, provider, method,
            valor_bruto, taxa_plataforma, valor_liquido, percentual_taxa, estado)
         VALUES ('service',$1,$2,$3,$4,$5,$6,$7,$8,$9,'pending')
         RETURNING id`,
        [
          req.usuario.id,
          order.trabalhador_id,
          order.id,
          provider.id,
          req.body.method || 'pix',
          split.gross,
          split.platformFee,
          split.netAmount,
          split.feePercent,
        ]
      );
      txId = ins.rows[0].id;

      await conn.consultarBanco(
        `INSERT INTO transacoes_servico
           (pedido_id, cliente_id, trabalhador_id, transacao_pagamento_id,
            valor_bruto, percentual_taxa, taxa_plataforma, valor_liquido, estado)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending')
         ON CONFLICT (pedido_id) DO UPDATE SET
           transacao_pagamento_id = EXCLUDED.transacao_pagamento_id,
           valor_bruto = EXCLUDED.valor_bruto,
           percentual_taxa  = EXCLUDED.percentual_taxa,
           taxa_plataforma = EXCLUDED.taxa_plataforma,
           valor_liquido   = EXCLUDED.valor_liquido,
           atualizado_em   = NOW()`,
        [
          order.id,
          order.cliente_id,
          order.trabalhador_id,
          txId,
          split.gross,
          split.feePercent,
          split.platformFee,
          split.netAmount,
        ]
      );

      await conn.consultarBanco('COMMIT');
    } catch (err) {
      await conn.consultarBanco('ROLLBACK');
      throw err;
    } finally {
      conn.release();
    }

    // ---- Cobrança no provedor ----
    let charge;
    try {
      charge = await provider.createPixPayment({
        quantidade: split.gross,
        descricao: `MoviPay · ${order.titulo_servico || 'Serviço'} (pedido #${order.id})`,
        payer: { nome: payer.rows[0].nome, email: payer.rows[0].email, cpf: payer.rows[0].cpf },
        externalReference: `svc-${txId}`,
      });
    } catch (err) {
      await consultarBanco(
        `UPDATE transacoes_pagamento SET estado = 'rejected', detalhe_estado = $1, atualizado_em = NOW() WHERE id = $2`,
        [String((err.mensagem || err.message)).slice(0, 500), txId]
      );
      if (err.missingCredentials) {
        throw new ErroApi(503, (err.mensagem || err.message), { code: 'PAYMENT_NOT_CONFIGURED' });
      }
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

    res.status(201).json({ pagamento: rows[0], commission: split });
  })
);

/** * GET /api/v1/pagamentos/:id Consulta o estado. Se ainda estiver pendente, REVALIDA no provedor antes de responder — é isso que faz a tela de "aguardando Pix" virar "aprovado" soz... */
router.get(
  '/:id',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const found = await consultarBanco('SELECT * FROM transacoes_pagamento WHERE id = $1', [req.params.id]);
    const tx = found.rows[0];
    if (!tx) throw new ErroApi(404, 'Pagamento não encontrado.');
    assert(tx.pagador_id === req.usuario.id || tx.recebedor_id === req.usuario.id, 403, 'Você não tem acesso a este pagamento.');

    if (tx.estado === 'pending' && tx.pagamento_provedor_id) {
      const provider = obterProvedor(tx.provider);
      try {
        const remote = await provider.getPayment(tx.pagamento_provedor_id);
        if (remote?.estado && remote.estado !== tx.estado) {
          await aplicarEstadoPagamento(tx.id, remote.estado, remote.statusDetail, remote.paidAt);
          const fresh = await consultarBanco('SELECT * FROM transacoes_pagamento WHERE id = $1', [tx.id]);
          return res.json({ pagamento: fresh.rows[0] });
        }
      } catch {
        // Falha ao consultar o provedor não muda o estado local — o pagamento continua pendente até alguém confirmar de verdade.
      }
    }

    // Expiração é decidida pelo relógio do servidor, não do celular.
    if (tx.estado === 'pending' && tx.expira_em && new Date(tx.expira_em) < new Date()) {
      await aplicarEstadoPagamento(tx.id, 'expired', 'Cobrança expirada.');
      const fresh = await consultarBanco('SELECT * FROM transacoes_pagamento WHERE id = $1', [tx.id]);
      return res.json({ pagamento: fresh.rows[0] });
    }

    res.json({ pagamento: tx });
  })
);

/** * POST /api/v1/pagamentos/webhook/mercadopago Aqui é onde um pagamento realmente vira "aprovado". A assinatura do cabeçalho `x-signature` é conferida antes de qualquer coisa, e ca... */
router.post(
  '/webhook/mercadopago',
  lidarAssincrono(async (req, res) => {
    const provider = obterProvedor('mercadopago');
    const dataId = req.body?.data?.id || req.query['data.id'] || req.query.id;
    const eventType = req.body?.tipo || req.body?.action || req.query.topic || 'unknown';

    if (!dataId) return res.status(200).json({ ignored: true, reason: 'sem data.id' });

    const verification = provider.verifyWebhookSignature({
      signatureHeader: req.headers['x-signature'],
      requestId: req.headers['x-request-id'],
      dataId,
    });
    if (!verification.ok) {
      console.warn('[webhook] assinatura recusada:', verification.reason);
      return res.status(401).json({ error: { mensagem: 'Assinatura do webhook inválida.' } });
    }

    const eventKey = `${eventType}:${dataId}`;
    const already = await consultarBanco(
      `INSERT INTO eventos_webhook_pagamento (provider, event_id, event_type, payload)
       VALUES ('mercadopago',$1,$2,$3) ON CONFLICT (provider, event_id) DO NOTHING RETURNING id`,
      [eventKey, String(eventType).slice(0, 60), JSON.stringify(req.body || {})]
    );
    if (!already.rows[0]) return res.status(200).json({ duplicated: true });

    if (!String(eventType).includes('payment')) {
      return res.status(200).json({ ignored: true, reason: 'evento não é de pagamento' });
    }

    try {
      const remote = await provider.getPayment(dataId);
      const local = await consultarBanco(
        `SELECT id FROM transacoes_pagamento WHERE provider = 'mercadopago' AND pagamento_provedor_id = $1`,
        [String(dataId)]
      );
      if (local.rows[0]) {
        await aplicarEstadoPagamento(local.rows[0].id, remote.estado, remote.statusDetail, remote.paidAt);
      }
    } catch (err) {
      console.error('[webhook] falha ao processar pagamento', dataId, (err.mensagem || err.message));
    }

    res.status(200).json({ received: true });
  })
);

/** * POST /api/v1/pagamentos/:id/confirm-manual Só existe para o provedor `manual_pix` (Pix na chave da empresa), em que não há webhook. Exige o cabeçalho `x-admin-token` batendo com... */
router.post(
  '/:id/confirm-manual',
  lidarAssincrono(async (req, res) => {
    const expected = process.env.ADMIN_CONFIRM_TOKEN;
    assert(expected, 503, 'Confirmação manual desativada: defina ADMIN_CONFIRM_TOKEN no .env.');
    assert(req.headers['x-admin-token'] === expected, 403, 'Token administrativo inválido.');

    const found = await consultarBanco('SELECT * FROM transacoes_pagamento WHERE id = $1', [req.params.id]);
    const tx = found.rows[0];
    if (!tx) throw new ErroApi(404, 'Pagamento não encontrado.');
    assert(tx.provider === 'manual_pix', 400, 'Este pagamento é de um gateway com confirmação automática.');
    assert(tx.estado === 'pending', 400, `Este pagamento já está como "${tx.estado}".`);

    await aplicarEstadoPagamento(tx.id, 'approved', 'Recebimento confirmado manualmente.', new Date());
    const fresh = await consultarBanco('SELECT * FROM transacoes_pagamento WHERE id = $1', [tx.id]);
    res.json({ pagamento: fresh.rows[0] });
  })
);

/** POST /api/v1/pagamentos/:id/cancelar — o pagador desiste de uma cobrança pendente. */
router.post(
  '/:id/cancelar',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const found = await consultarBanco('SELECT * FROM transacoes_pagamento WHERE id = $1', [req.params.id]);
    const tx = found.rows[0];
    if (!tx) throw new ErroApi(404, 'Pagamento não encontrado.');
    assert(tx.pagador_id === req.usuario.id, 403, 'Somente quem criou a cobrança pode cancelá-la.');
    assert(tx.estado === 'pending', 400, 'Só é possível cancelar uma cobrança pendente.');

    await aplicarEstadoPagamento(tx.id, 'cancelled', 'Cancelado pelo usuário.');
    const fresh = await consultarBanco('SELECT * FROM transacoes_pagamento WHERE id = $1', [tx.id]);
    res.json({ pagamento: fresh.rows[0] });
  })
);

module.exports = router;
