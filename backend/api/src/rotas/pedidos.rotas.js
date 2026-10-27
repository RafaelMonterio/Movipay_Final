const { Router } = require('express');
const { consultarBanco, obterClienteBanco } = require('../banco/conexao');
const { intermediarioAutenticacao } = require('../intermediarios/autenticacao');
const { lidarAssincrono } = require('../intermediarios/lidarAssincrono');
const { ErroApi, assert, exigirCampos } = require('../intermediarios/tratamentoErros');
const { dividirComTaxaPlataforma, obterPercentualComissao } = require('../utilitarios/dinheiro');
const { debitarFolhas } = require('../servicos/folhas');

const router = Router();

const ORDER_FIELDS = `o.id, o.cliente_id, o.trabalhador_id, o.servico_id, o.estado, o.price, o.anotacoes,
  o.agendado_para, o.concluido_em, o.cancelado_em, o.motivo_cancelamento, o.pago_em, o.criado_em, o.atualizado_em,
  o.endereco_id, o.numero_endereco, o.complemento_endereco, oa.rua AS address_street, oa.bairro AS address_neighborhood,
  cu.nome AS nome_cliente, cu.url_avatar AS url_avatar_cliente, cu.telefone AS client_phone,
  wu.nome AS nome_trabalhador, wu.url_avatar AS url_avatar_trabalhador, wu.telefone AS telefone_trabalhador,
  wu.media_avaliacao AS worker_avg_rating,
  s.titulo AS titulo_servico, c.nome AS nome_categoria, c.icone AS icone_categoria`;

const ORDER_JOINS = `FROM pedidos o
  JOIN usuarios cu ON cu.id = o.cliente_id
  JOIN usuarios wu ON wu.id = o.trabalhador_id
  LEFT JOIN servicos s ON s.id = o.servico_id
  LEFT JOIN categorias c ON c.id = s.categoria_id
  LEFT JOIN enderecos oa ON oa.id = o.endereco_id`;

// A trigger do banco (trg_validate_order_status) só garante que a MÁQUINA DE ESTADOS é respeitada. Ela não sabe (nem deveria saber) QUEM está autoriz...
const WHO_CAN = {
  accepted: 'worker',
  in_progress: 'worker',
  completed: 'worker',
  cancelled: 'either',
};

router.get(
  '/',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const role = req.query.role === 'client' || req.query.role === 'worker' ? req.query.role : req.usuario.modo;
    const column = role === 'worker' ? 'o.trabalhador_id' : 'o.cliente_id';
    const conditions = [`${column} = $1`];
    const params = [req.usuario.id];

    if (req.query.estado) {
      const statuses = String(req.query.estado).split(',').map((s) => s.trim());
      params.push(statuses);
      conditions.push(`o.estado = ANY($${params.length})`);
    }

    const { rows } = await consultarBanco(
      `SELECT ${ORDER_FIELDS} ${ORDER_JOINS} WHERE ${conditions.join(' AND ')} ORDER BY o.criado_em DESC`,
      params
    );
    res.json({ pedidos: rows, role });
  })
);

router.get(
  '/:id',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const { rows } = await consultarBanco(`SELECT ${ORDER_FIELDS} ${ORDER_JOINS} WHERE o.id = $1`, [req.params.id]);
    const order = rows[0];
    if (!order) throw new ErroApi(404, 'Pedido não encontrado.');
    assert(order.cliente_id === req.usuario.id || order.trabalhador_id === req.usuario.id, 403, 'Você não tem acesso a este pedido.');

    const history = await consultarBanco(
      `SELECT estado, note, criado_em FROM historico_status_pedido WHERE pedido_id = $1 ORDER BY criado_em ASC`,
      [req.params.id]
    );
    const review = await consultarBanco(`SELECT id, rating, comment, avaliador_id FROM avaliacoes WHERE pedido_id = $1`, [
      req.params.id,
    ]);
    const payment = await consultarBanco(`SELECT estado, quantidade, held_at, liberado_em FROM pagamentos WHERE pedido_id = $1`, [
      req.params.id,
    ]);

    // Discriminação da comissão — o cliente vê o bruto; o trabalhador vê bruto, taxa e líquido. Ninguém vê o valor "cru" sem a taxa.
    const commission = await consultarBanco(
      `SELECT valor_bruto, percentual_taxa, taxa_plataforma, valor_liquido, estado
       FROM transacoes_servico WHERE pedido_id = $1`,
      [req.params.id]
    );
    const gateway = await consultarBanco(
      `SELECT id, estado, method, dados_pix, expira_em, pago_em
       FROM transacoes_pagamento WHERE pedido_id = $1 ORDER BY criado_em DESC LIMIT 1`,
      [req.params.id]
    );

    const isWorker = order.trabalhador_id === req.usuario.id;
    const breakdown = commission.rows[0]
      ? isWorker
        ? commission.rows[0]
        : {
            valor_bruto: commission.rows[0].valor_bruto,
            percentual_taxa: commission.rows[0].percentual_taxa,
            estado: commission.rows[0].estado,
          }
      : null;

    res.json({ pedido: order,
      historico: history.rows,
      avaliacao: review.rows[0] || null,
      pagamento: payment.rows[0] || null,
      commission: breakdown,
      commissionPercent: await obterPercentualComissao(),
      gatewayPayment: gateway.rows[0] || null,
    });
  })
);

router.post(
  '/',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    assert(req.usuario.modo === 'client', 403, 'Somente contas em modo cliente podem criar pedidos.');
    const servicoId = req.body.servico_id || req.body.service_id;
    let trabalhadorId = req.body.trabalhador_id || req.body.worker_id;
    if (!trabalhadorId && servicoId) {
      const owner = await consultarBanco('SELECT trabalhador_id FROM servicos WHERE id = $1', [servicoId]);
      trabalhadorId = owner.rows[0]?.trabalhador_id;
    }
    exigirCampos({ trabalhador_id: trabalhadorId, servico_id: servicoId }, ['trabalhador_id', 'servico_id']);

    const svc = await consultarBanco(
      `SELECT s.id, s.titulo, s.price, s.trabalhador_id, u.esta_ativo AS worker_active
       FROM servicos s JOIN usuarios u ON u.id = s.trabalhador_id
       WHERE s.id = $1 AND s.trabalhador_id = $2 AND s.esta_ativo = TRUE`,
      [servicoId, trabalhadorId]
    );
    const service = svc.rows[0];
    if (!service) throw new ErroApi(404, 'Serviço não encontrado para este trabalhador.');
    assert(service.worker_active, 400, 'Este trabalhador está indisponível no momento.');

    let enderecoId = req.body.endereco_id || req.body.address_id;
    let numeroEndereco = req.body.numero_endereco || req.body.address_number;
    if (!enderecoId || !numeroEndereco) {
      const defaultAddress = await consultarBanco('SELECT endereco_id, numero_endereco FROM usuarios WHERE id = $1', [req.usuario.id]);
      enderecoId = enderecoId || defaultAddress.rows[0]?.endereco_id;
      numeroEndereco = numeroEndereco || defaultAddress.rows[0]?.numero_endereco;
    }
    exigirCampos({ endereco_id: enderecoId, numero_endereco: numeroEndereco }, ['endereco_id', 'numero_endereco']);
    const addressCheck = await consultarBanco('SELECT id FROM enderecos WHERE id = $1', [enderecoId]);
    assert(addressCheck.rows[0], 400, 'Endereço inválido — escolha um endereço real de Ribeirão Pires.');

    const client = await obterClienteBanco();
    let orderId;
    try {
      await client.consultarBanco('BEGIN');
      const ins = await client.consultarBanco(
        `INSERT INTO pedidos (cliente_id, trabalhador_id, servico_id, price, notes, agendado_para, endereco_id, numero_endereco, complemento_endereco)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
        [
          req.usuario.id,
          trabalhadorId,
          service.id,
          service.price,
          req.body.anotacoes || null,
          req.body.agendado_para || null,
          enderecoId,
          numeroEndereco,
          req.body.complemento_endereco || null,
        ]
      );
      orderId = ins.rows[0].id;
      await client.consultarBanco(
        `INSERT INTO historico_status_pedido (pedido_id, estado, note) VALUES ($1,'pending','Pedido criado pelo cliente')`,
        [orderId]
      );
      await client.consultarBanco(
        `INSERT INTO pagamentos (pedido_id, pagador_id, recebedor_id, quantidade, estado) VALUES ($1,$2,$3,$4,'held')`,
        [orderId, req.usuario.id, trabalhadorId, service.price]
      );
      if (req.body.agendado_para) {
        await debitarFolhas(client, {
          usuarioId: req.usuario.id,
          pedidoId: orderId,
          tipo: 'order_schedule',
          descricao: 'Débito de Folhas pelo agendamento do pedido',
        });
      }

      // Comissão de 15% registrada já na criação do pedido, calculada no BACKEND a partir do preço do serviço (o app nunca envia valor). Fica como 'pending...
      const split = await dividirComTaxaPlataforma(service.price);
      await client.consultarBanco(
        `INSERT INTO transacoes_servico
           (pedido_id, cliente_id, trabalhador_id, valor_bruto, percentual_taxa, taxa_plataforma, valor_liquido, estado)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'pending')
         ON CONFLICT (pedido_id) DO NOTHING`,
        [orderId, req.usuario.id, trabalhadorId, split.gross, split.feePercent, split.platformFee, split.netAmount]
      );

      await client.consultarBanco('COMMIT');
    } catch (err) {
      await client.consultarBanco('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    const { rows } = await consultarBanco(`SELECT ${ORDER_FIELDS} ${ORDER_JOINS} WHERE o.id = $1`, [orderId]);
    res.status(201).json({ pedido: rows[0] });
  })
);

router.patch(
  '/:id/estado',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const { estado: nextStatus, motivo_cancelamento: cancelReason } = req.body;
    exigirCampos(req.body, ['estado']);

    const found = await consultarBanco('SELECT cliente_id, trabalhador_id, estado FROM pedidos WHERE id = $1', [req.params.id]);
    const order = found.rows[0];
    if (!order) throw new ErroApi(404, 'Pedido não encontrado.');

    const isClient = order.cliente_id === req.usuario.id;
    const isWorker = order.trabalhador_id === req.usuario.id;
    assert(isClient || isWorker, 403, 'Você não tem acesso a este pedido.');

    const who = WHO_CAN[nextStatus];
    if (who === 'worker') assert(isWorker, 403, 'Somente o trabalhador pode fazer essa alteração.');
    if (who === 'either') assert(isClient || isWorker, 403, 'Você não tem acesso a este pedido.');
    if (!who) throw new ErroApi(400, `Status de destino inválido: "${nextStatus}".`);
    if (nextStatus === 'cancelled') exigirCampos(req.body, ['motivo_cancelamento']);

    // A trigger trg_validate_order_status faz a validação da máquina de estados (ex.: não deixa sair de "completed"); se a transição não fizer sentido, e...
    const { rows } = await consultarBanco(
      `UPDATE pedidos SET estado = $1, motivo_cancelamento = COALESCE($2, motivo_cancelamento) WHERE id = $3 RETURNING id`,
      [nextStatus, cancelReason || null, req.params.id]
    );

    if (nextStatus === 'completed') {
      const payment = await consultarBanco(
        `UPDATE pagamentos SET estado = 'released', liberado_em = NOW()
         WHERE pedido_id = $1 AND estado = 'held' RETURNING quantidade, recebedor_id`,
        [req.params.id]
      );
      if (payment.rows[0]) {
        // Se a cobrança já passou pelo gateway, o líquido JÁ foi creditado em aplicarEstadoPagamento — creditar de novo aqui pagaria em dobro.
        const gatewayPaid = await consultarBanco(
          `SELECT 1 FROM transacoes_pagamento
           WHERE pedido_id = $1 AND kind = 'service' AND estado = 'approved' LIMIT 1`,
          [req.params.id]
        );

        if (!gatewayPaid.rows[0]) {
          // Fluxo de escrow interno: o trabalhador recebe o LÍQUIDO (bruto menos os 15% da plataforma), nunca o bruto.
          const split = await dividirComTaxaPlataforma(payment.rows[0].quantidade);

          await consultarBanco(
            `UPDATE transacoes_servico
             SET estado = 'released', liberado_em = NOW(),
                 valor_bruto = $2, percentual_taxa = $3, taxa_plataforma = $4, valor_liquido = $5, atualizado_em = NOW()
             WHERE pedido_id = $1`,
            [req.params.id, split.gross, split.feePercent, split.platformFee, split.netAmount]
          );

          await consultarBanco(
            `INSERT INTO comissoes_plataforma
               (source, transacao_servico_id, trabalhador_id, cliente_id, valor_bruto, percentual_taxa, quantidade)
             SELECT 'service', st.id, st.trabalhador_id, st.cliente_id, st.valor_bruto, st.percentual_taxa, st.taxa_plataforma
             FROM transacoes_servico st WHERE st.pedido_id = $1`,
            [req.params.id]
          );

          await consultarBanco(`UPDATE usuarios SET saldo_carteira = saldo_carteira + $1 WHERE id = $2`, [
            split.netAmount,
            payment.rows[0].recebedor_id,
          ]);
        } else {
          await consultarBanco(
            `UPDATE transacoes_servico SET estado = 'released', liberado_em = NOW(), atualizado_em = NOW()
             WHERE pedido_id = $1`,
            [req.params.id]
          );
        }
      }
    }
    if (nextStatus === 'cancelled') {
      await consultarBanco(`UPDATE pagamentos SET estado = 'cancelled' WHERE pedido_id = $1 AND estado = 'held'`, [
        req.params.id,
      ]);
      await consultarBanco(
        `UPDATE transacoes_servico SET estado = 'cancelled', atualizado_em = NOW()
         WHERE pedido_id = $1 AND estado = 'pending'`,
        [req.params.id]
      );
    }

    const updated = await consultarBanco(`SELECT ${ORDER_FIELDS} ${ORDER_JOINS} WHERE o.id = $1`, [rows[0].id]);
    res.json({ pedido: updated.rows[0] });
  })
);

module.exports = router;
