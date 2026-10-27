const { Router } = require('express');
const { consultarBanco, obterClienteBanco } = require('../banco/conexao');
const { intermediarioAutenticacao } = require('../intermediarios/autenticacao');
const { lidarAssincrono } = require('../intermediarios/lidarAssincrono');
const { ErroApi, assert, exigirCampos } = require('../intermediarios/tratamentoErros');
const { debitarFolhas } = require('../servicos/folhas');

const router = Router();

const QUOTE_FIELDS = `q.id, q.cliente_id, q.categoria_id, q.titulo, q.descricao, q.orcamento_maximo, q.cidade,
  q.endereco_id, q.numero_endereco, qa.rua AS address_street, qa.bairro AS address_neighborhood,
  q.estado, q.expira_em, q.criado_em, q.texto_categoria_personalizada, q.foi_impulsionado, q.impulso_expira_em,
  cu.nome AS nome_cliente, cu.url_avatar AS url_avatar_cliente,
  cat.nome AS nome_categoria, cat.icone AS icone_categoria, cat.slug AS categoria_slug`;
const QUOTE_JOINS = `FROM orcamentos q JOIN usuarios cu ON cu.id = q.cliente_id LEFT JOIN categorias cat ON cat.id = q.categoria_id
  LEFT JOIN enderecos qa ON qa.id = q.endereco_id`;

// Convenção adotada aqui (a coluna usuarios.categoria existe desde a migration 009, mas nenhum lugar do backend original de fato a usava): ela guarda o S...

// Simulador de orçamento instantâneo (não existia no backend original). É uma estimativa por categoria + porte, deixada explícita como tal — não é um...
const BASE_PRICE_BY_SLUG = {
  limpeza: 100,
  eletrica: 90,
  pintura: 200,
  encanamento: 110,
  jardinagem: 80,
  mudanca: 250,
  informatica: 90,
  reforma: 220,
  'cuidado-pessoal': 60,
  aulas: 50,
};

router.get(
  '/informacoes-impulso',
  lidarAssincrono(async (req, res) => {
    const { obterConfiguracaoImpulsoOrcamento } = require('../utilitarios/dinheiro');
    const settings = await obterConfiguracaoImpulsoOrcamento();
    res.json(settings);
  })
);

router.post(
  '/estimativa',
  lidarAssincrono(async (req, res) => {
    exigirCampos(req.body, ['categoria_id']);
    const { rows } = await consultarBanco('SELECT slug, nome, icone FROM categorias WHERE id = $1', [req.body.categoria_id]);
    if (!rows[0]) throw new ErroApi(404, 'Categoria não encontrada.');

    const size = req.body.size || 'medio';
    const urgency = req.body.urgency || 'normal';
    let base = BASE_PRICE_BY_SLUG[rows[0].slug] ?? 100;
    base *= { pequeno: 0.7, medio: 1, grande: 1.5 }[size] ?? 1;
    base *= { normal: 1, urgente: 1.25 }[urgency] ?? 1;

    res.json({
      categoria: rows[0],
      estimateMin: Math.round(base * 0.85),
      estimateMax: Math.round(base * 1.2),
      note: 'Estimativa aproximada — o valor final depende da proposta enviada pelo trabalhador.',
    });
  })
);

router.get(
  '/',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const role = req.query.role === 'client' || req.query.role === 'worker' ? req.query.role : req.usuario.modo;

    if (role === 'client') {
      const { rows } = await consultarBanco(
        `SELECT ${QUOTE_FIELDS}, (SELECT COUNT(*) FROM propostas_orcamento p WHERE p.orcamento_id = q.id) AS proposals_count
         ${QUOTE_JOINS} WHERE q.cliente_id = $1 ORDER BY q.criado_em DESC`,
        [req.usuario.id]
      );
      return res.json({ orcamentos: rows, role });
    }

    // Corrige o bug do backend original: lá, TODO trabalhador via TODOS os orçamentos abertos, de qualquer categoria. Aqui só aparecem os que casam com a...
    const me = await consultarBanco('SELECT category FROM usuarios WHERE id = $1', [req.usuario.id]);
    assert(me.rows[0]?.categoria, 400, 'Defina sua categoria de atuação no perfil para ver oportunidades.');

    const { rows } = await consultarBanco(
      `SELECT ${QUOTE_FIELDS}, EXISTS(
         SELECT 1 FROM propostas_orcamento p WHERE p.orcamento_id = q.id AND p.trabalhador_id = $2
       ) AS already_proposed
       ${QUOTE_JOINS}
       WHERE q.estado IN ('open','in_review') AND q.expira_em > NOW()
         AND (cat.slug = $1 OR cat.slug = 'outros')
       ORDER BY q.foi_impulsionado DESC, q.criado_em DESC`,
      [me.rows[0].categoria, req.usuario.id]
    );
    res.json({ orcamentos: rows, role });
  })
);

router.get(
  '/:id',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const { rows } = await consultarBanco(`SELECT ${QUOTE_FIELDS} ${QUOTE_JOINS} WHERE q.id = $1`, [req.params.id]);
    const quote = rows[0];
    if (!quote) throw new ErroApi(404, 'Orçamento não encontrado.');

    if (quote.cliente_id === req.usuario.id) {
      const proposals = await consultarBanco(
        `SELECT p.id, p.price, p.mensagem, p.estado, p.criado_em, p.trabalhador_id,
                u.nome AS nome_trabalhador, u.url_avatar AS url_avatar_trabalhador, u.media_avaliacao, u.total_avaliacoes
         FROM propostas_orcamento p JOIN usuarios u ON u.id = p.trabalhador_id
         WHERE p.orcamento_id = $1 ORDER BY p.price ASC`,
        [req.params.id]
      );
      return res.json({ orcamento: quote, propostas: proposals.rows, isOwner: true });
    }

    const mine = await consultarBanco(
      `SELECT id, price, mensagem, estado, criado_em FROM propostas_orcamento WHERE orcamento_id = $1 AND trabalhador_id = $2`,
      [req.params.id, req.usuario.id]
    );
    res.json({ orcamento: quote, propostas: mine.rows, isOwner: false });
  })
);

router.post(
  '/',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    assert(req.usuario.modo === 'client', 403, 'Somente contas em modo cliente podem pedir orçamentos.');
    exigirCampos(req.body, ['categoria_id', 'titulo', 'descricao', 'endereco_id', 'numero_endereco']);
    const addressCheck = await consultarBanco('SELECT id, cidade FROM enderecos WHERE id = $1', [req.body.endereco_id]);
    assert(addressCheck.rows[0], 400, 'Endereço inválido — escolha um endereço real de Ribeirão Pires.');

    const categoryCheck = await consultarBanco('SELECT slug FROM categorias WHERE id = $1', [req.body.categoria_id]);
    assert(categoryCheck.rows[0], 400, 'Categoria inválida.');
    const isOutros = categoryCheck.rows[0].slug === 'outros';
    let customCategoryText = null;
    if (isOutros) {
      customCategoryText = String(req.body.texto_categoria_personalizada || '').trim();
      assert(customCategoryText.length >= 3, 400, 'Descreva em poucas palavras o serviço que você precisa.');
      assert(customCategoryText.length <= 200, 400, 'Descrição muito longa — resuma em até 200 caracteres.');
    }

    const { rows } = await consultarBanco(
      `INSERT INTO orcamentos (cliente_id, categoria_id, titulo, descricao, orcamento_maximo, cidade, endereco_id, numero_endereco, texto_categoria_personalizada)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [
        req.usuario.id,
        req.body.categoria_id,
        req.body.titulo,
        req.body.descricao,
        req.body.orcamento_maximo || null,
        addressCheck.rows[0].cidade,
        req.body.endereco_id,
        req.body.numero_endereco,
        customCategoryText,
      ]
    );
    const created = await consultarBanco(`SELECT ${QUOTE_FIELDS} ${QUOTE_JOINS} WHERE q.id = $1`, [rows[0].id]);
    res.status(201).json({ orcamento: created.rows[0] });
  })
);

router.post(
  '/:id/propostas',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    assert(req.usuario.modo === 'worker', 403, 'Somente trabalhadores podem enviar propostas.');
    exigirCampos(req.body, ['price', 'mensagem']);

    const quoteRes = await consultarBanco(
      `SELECT q.*, cat.slug AS categoria_slug FROM orcamentos q LEFT JOIN categorias cat ON cat.id = q.categoria_id WHERE q.id = $1`,
      [req.params.id]
    );
    const quote = quoteRes.rows[0];
    if (!quote) throw new ErroApi(404, 'Orçamento não encontrado.');
    assert(['open', 'in_review'].includes(quote.estado), 409, 'Este orçamento não está mais aberto para propostas.');

    const me = await consultarBanco('SELECT category FROM usuarios WHERE id = $1', [req.usuario.id]);
    assert(
      quote.categoria_slug === 'outros' || (me.rows[0]?.categoria && me.rows[0].categoria === quote.categoria_slug),
      403,
      'Sua categoria não corresponde à categoria deste orçamento.'
    );

    const existing = await consultarBanco('SELECT id FROM propostas_orcamento WHERE orcamento_id = $1 AND trabalhador_id = $2', [
      req.params.id,
      req.usuario.id,
    ]);
    if (existing.rows[0]) throw new ErroApi(409, 'Você já enviou uma proposta para este orçamento.');

    const { rows } = await consultarBanco(
      `INSERT INTO propostas_orcamento (orcamento_id, trabalhador_id, price, mensagem) VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.params.id, req.usuario.id, req.body.price, req.body.mensagem]
    );
    await consultarBanco(`UPDATE orcamentos SET estado = 'in_review' WHERE id = $1 AND estado = 'open'`, [req.params.id]);
    res.status(201).json({ proposta: rows[0] });
  })
);

// Corrige o maior gap do backend original: aceitar uma proposta agora cria de verdade um pedido (pedidos) — antes só mudava o estado da proposta e do...
router.patch(
  '/:id/propostas/:pid',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const { estado: nextStatus } = req.body;
    exigirCampos(req.body, ['estado']);
    assert(['accepted', 'rejected'].includes(nextStatus), 400, "'estado' deve ser 'accepted' ou 'rejected'.");

    const quoteRes = await consultarBanco('SELECT * FROM orcamentos WHERE id = $1', [req.params.id]);
    const quote = quoteRes.rows[0];
    if (!quote) throw new ErroApi(404, 'Orçamento não encontrado.');
    assert(quote.cliente_id === req.usuario.id, 403, 'Somente quem criou o orçamento pode decidir sobre as propostas.');

    const propRes = await consultarBanco('SELECT * FROM propostas_orcamento WHERE id = $1 AND orcamento_id = $2', [
      req.params.pid,
      req.params.id,
    ]);
    const proposal = propRes.rows[0];
    if (!proposal) throw new ErroApi(404, 'Proposta não encontrada.');
    assert(proposal.estado === 'pending', 409, 'Esta proposta já foi respondida.');

    let createdOrderId = null;
    const client = await obterClienteBanco();
    try {
      await client.consultarBanco('BEGIN');
      await client.consultarBanco(`UPDATE propostas_orcamento SET estado = $1 WHERE id = $2`, [nextStatus, req.params.pid]);

      if (nextStatus === 'accepted') {
        await client.consultarBanco(`UPDATE propostas_orcamento SET estado = 'rejected' WHERE orcamento_id = $1 AND id != $2`, [
          req.params.id,
          req.params.pid,
        ]);
        await client.consultarBanco(`UPDATE orcamentos SET estado = 'closed' WHERE id = $1`, [req.params.id]);

        const orderIns = await client.consultarBanco(
          `INSERT INTO pedidos (cliente_id, trabalhador_id, price, notes, endereco_id, numero_endereco)
           VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
          [
            quote.cliente_id,
            proposal.trabalhador_id,
            proposal.price,
            `Orçamento: ${quote.titulo}\n${proposal.mensagem}`,
            quote.endereco_id,
            quote.numero_endereco,
          ]
        );
        createdOrderId = orderIns.rows[0].id;

        await client.consultarBanco(
          `INSERT INTO historico_status_pedido (pedido_id, estado, note) VALUES ($1,'pending','Pedido originado de um orçamento')`,
          [createdOrderId]
        );
        // O pedido nasce 'pending' e já sobe direto para 'accepted' (a proposta já foi negociada) — a trigger valida a transição e a trigger de histórico reg...
        await client.consultarBanco(`UPDATE pedidos SET estado = 'accepted' WHERE id = $1 AND estado = 'pending'`, [
          createdOrderId,
        ]);
        await client.consultarBanco(
          `INSERT INTO pagamentos (pedido_id, pagador_id, recebedor_id, quantidade, estado) VALUES ($1,$2,$3,$4,'held')`,
          [createdOrderId, quote.cliente_id, proposal.trabalhador_id, proposal.price]
        );
        await debitarFolhas(client, {
          usuarioId: quote.cliente_id,
          pedidoId: createdOrderId,
          tipo: 'order_proposal_accept',
          descricao: 'Débito de Folhas pelo aceite de proposta',
        });
      }
      await client.consultarBanco('COMMIT');
    } catch (err) {
      await client.consultarBanco('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    res.json({ proposalId: Number(req.params.pid), estado: nextStatus, createdOrderId });
  })
);

/** * POST /api/v1/orcamentos/:id/impulsionar "Melhor divulgação" — o cliente paga um valor fixo (hoje R$10, lido de configuracoes_plataforma) para destacar este orçamento específico. Mesmo princípi... */
router.post(
  '/:id/impulsionar',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const { obterProvedor, descreverConfiguracao } = require('../servicos/pagamentos');
    const { obterConfiguracaoImpulsoOrcamento } = require('../utilitarios/dinheiro');

    const quoteRes = await consultarBanco('SELECT * FROM orcamentos WHERE id = $1', [req.params.id]);
    const quote = quoteRes.rows[0];
    if (!quote) throw new ErroApi(404, 'Orçamento não encontrado.');
    assert(quote.cliente_id === req.usuario.id, 403, 'Somente quem criou o orçamento pode divulgá-lo.');
    assert(['open', 'in_review'].includes(quote.estado), 400, 'Este orçamento não está mais aberto.');
    assert(!quote.foi_impulsionado, 409, 'Este orçamento já está com divulgação em destaque.');

    const existing = await consultarBanco(
      `SELECT * FROM transacoes_pagamento
       WHERE orcamento_id = $1 AND kind = 'quote_boost' AND estado IN ('pending','approved')
       ORDER BY criado_em DESC LIMIT 1`,
      [quote.id]
    );
    if (existing.rows[0]?.estado === 'approved') {
      return res.json({ pagamento: existing.rows[0], alreadyPaid: true });
    }
    if (existing.rows[0] && new Date(existing.rows[0].expira_em) > new Date()) {
      return res.json({ pagamento: existing.rows[0], reused: true });
    }

    const { price } = await obterConfiguracaoImpulsoOrcamento();
    const provider = obterProvedor();
    if (!provider.isConfigured()) {
      const cfg = descreverConfiguracao();
      throw new ErroApi(
        503,
        `Pagamento indisponível: falta configurar ${cfg.missingEnv.join(', ') || 'as credenciais do gateway'} no .env do backend.`,
        { code: 'PAYMENT_NOT_CONFIGURED', missingEnv: cfg.missingEnv }
      );
    }

    const payer = await consultarBanco('SELECT nome, email, cpf FROM usuarios WHERE id = $1', [req.usuario.id]);

    const txRes = await consultarBanco(
      `INSERT INTO transacoes_pagamento
         (kind, pagador_id, orcamento_id, provider, method, valor_bruto, taxa_plataforma, valor_liquido, percentual_taxa, estado)
       VALUES ('quote_boost',$1,$2,$3,'pix',$4,$4,0,100,'pending')
       RETURNING id`,
      [req.usuario.id, quote.id, provider.id, price]
    );
    const txId = txRes.rows[0].id;

    let charge;
    try {
      charge = await provider.createPixPayment({
        quantidade: price,
        descricao: `MoviPay · Divulgação em destaque — "${quote.titulo}"`,
        payer: { nome: payer.rows[0].nome, email: payer.rows[0].email, cpf: payer.rows[0].cpf },
        externalReference: `quoteboost-${txId}`,
      });
    } catch (err) {
      await consultarBanco(`UPDATE transacoes_pagamento SET estado = 'rejected', detalhe_estado = $1 WHERE id = $2`, [
        String((err.mensagem || err.message)).slice(0, 500),
        txId,
      ]);
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

    res.status(201).json({ pagamento: rows[0], price });
  })
);

module.exports = router;
