/** * Ponto único de verdade sobre "o que é um usuário público". Antes, `autenticacao.rotas.js` e `usuarios.routes.js` tinham cópias do mesmo SELECT gigante — qualquer campo novo precisava se... */

const { consultarBanco } = require('../banco/conexao');
const { obterInformacoesNivel } = require('../utilitarios/niveis');
const { maskCpf } = require('../utilitarios/cpf');
const { calcularIdade } = require('../utilitarios/idade');

const USER_SELECT = `SELECT
  u.id, u.nome, u.email, u.modo, u.pontos, u.url_avatar, u.telefone, u.bio,
  u.cidade, u.bairro, u.lat, u.lng, u.category, u.eh_verificado, u.esta_disponivel,
  u.saldo_carteira, u.media_tempo_resposta, u.media_avaliacao, u.total_pedidos, u.total_avaliacoes,
  u.criado_em, u.endereco_id, u.numero_endereco, u.complemento_endereco,
  COALESCE((SELECT SUM(o.price) FROM pedidos o WHERE o.cliente_id = u.id AND o.estado = 'completed'), 0) AS total_investido,
  u.tipo_conta, u.eh_cliente, u.eh_trabalhador, u.data_nascimento, u.cpf, u.estado_cpf,
  u.worker_activated_at, u.slug_plano, u.plano_expira_em,
  a.cep AS address_cep, a.rua AS address_street,
  plan.nome AS nome_plano, plan.badge_label AS selo_plano,
  plan.tem_estatisticas AS plan_has_stats, plan.tem_estatisticas_avancadas AS plan_has_advanced_stats,
  wp.specialty, wp.descricao AS descricao_trabalhador, wp.experience,
  wp.preco_minimo, wp.preco_max, wp.tipo_preco, wp.modality, wp.area_servico,
  wp.dias_disponibilidade, wp.hora_inicio, wp.hora_fim,
  EXISTS(SELECT 1 FROM responsaveis_legais g WHERE g.usuario_id = u.id) AS tem_responsavel
  FROM usuarios u
  LEFT JOIN enderecos a ON a.id = u.endereco_id
  LEFT JOIN planos_assinatura plan ON plan.slug = u.slug_plano
  LEFT JOIN perfis_trabalhador wp ON wp.usuario_id = u.id`;

/** * Converte a linha do banco no objeto que o app recebe. @param {object} row @param {{ self?: boolean }} options `self` = é o próprio dono da conta */
function serializarUsuario(row, { self = true } = {}) {
  if (!row) return null;

  const { cpf, hash_senha: _ignored, ...rest } = row;

  const serialized = {
    ...rest,
    points: Number(row.pontos || 0),
    balance: Number(row.pontos || 0),
    folhas: Number(row.pontos || 0),
    totalInvested: Number(row.total_investido || 0),
    totalSpent: Number(row.total_investido || 0),
    levelInfo: obterInformacoesNivel(row.pontos),
    age: row.data_nascimento ? calcularIdade(row.data_nascimento) : null,
    // Só o próprio dono enxerga (mascarado). Para terceiros, nem isso.
    cpf_masked: self ? maskCpf(cpf) : null,
    has_cpf: Boolean(cpf),
  };

  if (!self) {
    delete serialized.data_nascimento;
    delete serialized.email;
    delete serialized.telefone;
    delete serialized.saldo_carteira;
    delete serialized.tem_responsavel;
    delete serialized.estado_cpf;
  }

  return serialized;
}

async function buscarUsuario(whereClause, params) {
  const { rows } = await consultarBanco(`${USER_SELECT} WHERE ${whereClause}`, params);
  return rows[0] || null;
}

async function buscarUsuarioById(id) {
  return buscarUsuario('u.id = $1', [id]);
}

/** * Grava/atualiza o perfil profissional dentro de uma transação já aberta. @param {import('pg').PoolClient} conn */
async function salvarPerfilTrabalhador(conn, userId, profile) {
  const days = Array.isArray(profile.dias_disponibilidade)
    ? profile.dias_disponibilidade.map((d) => Number(d)).filter((d) => d >= 0 && d <= 6)
    : [];

  const { rows } = await conn.consultarBanco(
    `INSERT INTO perfis_trabalhador
       (usuario_id, categoria_slug, specialty, descricao, experience,
        preco_minimo, preco_max, tipo_preco, modality, area_servico,
        dias_disponibilidade, observacao_disponibilidade, hora_inicio, hora_fim, esta_completo)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,TRUE)
     ON CONFLICT (usuario_id) DO UPDATE SET
       categoria_slug     = EXCLUDED.categoria_slug,
       specialty         = EXCLUDED.specialty,
       descricao       = EXCLUDED.descricao,
       experience        = EXCLUDED.experience,
       preco_minimo         = EXCLUDED.preco_minimo,
       preco_max         = EXCLUDED.preco_max,
       tipo_preco        = EXCLUDED.tipo_preco,
       modality          = EXCLUDED.modality,
       area_servico      = EXCLUDED.area_servico,
       dias_disponibilidade = EXCLUDED.dias_disponibilidade,
       observacao_disponibilidade = EXCLUDED.observacao_disponibilidade,
       hora_inicio        = EXCLUDED.hora_inicio,
       hora_fim          = EXCLUDED.hora_fim,
       esta_completo       = TRUE,
       atualizado_em        = NOW()
     RETURNING *`,
    [
      userId,
      profile.categoria_slug,
      String(profile.specialty).trim(),
      String(profile.descricao).trim(),
      String(profile.experience).trim(),
      profile.preco_minimo ?? null,
      profile.preco_max ?? null,
      profile.tipo_preco || 'service',
      profile.modality || 'presential',
      String(profile.area_servico).trim(),
      days,
      profile.observacao_disponibilidade || null,
      profile.hora_inicio ?? null,
      profile.hora_fim ?? null,
    ]
  );

  // Áreas de atendimento (substitui o conjunto anterior)
  if (Array.isArray(profile.areas_servico)) {
    await conn.consultarBanco('DELETE FROM areas_atendimento WHERE usuario_id = $1', [userId]);
    for (const area of profile.areas_servico) {
      if (!area?.cidade) continue;
      await conn.consultarBanco(
        `INSERT INTO areas_atendimento (usuario_id, cidade, regiao, raio_km)
         VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
        [userId, String(area.cidade).trim(), area.regiao ? String(area.regiao).trim() : null, area.raio_km ?? null]
      );
    }
  }

  return rows[0];
}

/** Grava o responsável legal (menores de 18). */
async function salvarResponsavel(conn, userId, guardian, ip) {
  const { rows } = await conn.consultarBanco(
    `INSERT INTO responsaveis_legais
       (usuario_id, nome, cpf, data_nascimento, relationship, telefone, email,
        consent_accepted, consent_text, consent_at, consent_ip)
     VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE,$8,NOW(),$9)
     ON CONFLICT (usuario_id) DO UPDATE SET
       nome             = EXCLUDED.nome,
       cpf              = EXCLUDED.cpf,
       data_nascimento       = EXCLUDED.data_nascimento,
       relationship     = EXCLUDED.relationship,
       telefone            = EXCLUDED.telefone,
       email            = EXCLUDED.email,
       consent_accepted = TRUE,
       consent_text     = EXCLUDED.consent_text,
       consent_at       = NOW(),
       consent_ip       = EXCLUDED.consent_ip,
       atualizado_em       = NOW()
     RETURNING id`,
    [
      userId,
      String(guardian.nome).trim(),
      guardian.cpf,
      guardian.data_nascimento,
      String(guardian.relationship).trim(),
      String(guardian.telefone).trim(),
      guardian.email ? String(guardian.email).toLowerCase().trim() : null,
      guardian.consent_text ||
        'Declaro ser o responsável legal e autorizo o cadastro e a atuação profissional do menor no MoviPay.',
      ip || null,
    ]
  );
  return rows[0];
}

module.exports = {
  USER_SELECT,
  serializarUsuario,
  buscarUsuario,
  buscarUsuarioById,
  salvarPerfilTrabalhador,
  salvarResponsavel,
};
