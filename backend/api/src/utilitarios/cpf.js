/** * Validação de CPF. Duas camadas: 1. `validarCpf` — validação LOCAL, offline, sempre ativa: formato (11 dígitos), rejeição de sequências repetidas (111.111.111-11 e afins, que... */

function somenteDigitos(value) {
  return String(value || '').replace(/\D/g, '');
}

function formatCpf(value) {
  const d = somenteDigitos(value);
  if (d.length !== 11) return value;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/** Mostra só os 3 últimos dígitos — usado em qualquer retorno para terceiros. */
function maskCpf(value) {
  const d = somenteDigitos(value);
  if (d.length !== 11) return null;
  return `***.***.${d.slice(6, 9)}-${d.slice(9)}`;
}

function checkDigit(digits, factorStart) {
  let total = 0;
  for (let i = 0; i < digits.length; i++) {
    total += Number(digits[i]) * (factorStart - i);
  }
  const rest = (total * 10) % 11;
  return rest === 10 || rest === 11 ? 0 : rest;
}

/** * @returns {{ valid: boolean, cpf: string|null, reason: string|null }} */
function validarCpf(value) {
  const cpf = somenteDigitos(value);

  if (cpf.length !== 11) {
    return { valid: false, cpf: null, reason: 'O CPF precisa ter 11 dígitos.' };
  }
  if (/^(\d)\1{10}$/.test(cpf)) {
    return { valid: false, cpf: null, reason: 'CPF inválido.' };
  }

  const d1 = checkDigit(cpf.slice(0, 9), 10);
  if (d1 !== Number(cpf[9])) {
    return { valid: false, cpf: null, reason: 'CPF inválido — confira os números digitados.' };
  }

  const d2 = checkDigit(cpf.slice(0, 10), 11);
  if (d2 !== Number(cpf[10])) {
    return { valid: false, cpf: null, reason: 'CPF inválido — confira os números digitados.' };
  }

  return { valid: true, cpf, reason: null };
}

function pickPath(obj, path) {
  if (!path) return undefined;
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

/** * Consulta externa opcional (ver comentário do topo). Nunca lança: qualquer falha de rede devolve estado 'pending' e o cadastro segue com a validação local. @returns {Promise<{... */
async function verificarCpfExternamente(cpf) {
  if (String(process.env.CPF_VALIDATION_ENABLED).toLowerCase() !== 'true') {
    return { estado: 'unverified' };
  }
  const urlTemplate = process.env.CPF_VALIDATION_API_URL;
  const apiKey = process.env.CPF_VALIDATION_API_KEY;
  if (!urlTemplate || !apiKey) {
    console.warn('[cpf] CPF_VALIDATION_ENABLED=true mas falta CPF_VALIDATION_API_URL/API_KEY — pulando consulta externa.');
    return { estado: 'unverified' };
  }

  const digits = somenteDigitos(cpf);
  const url = urlTemplate.includes('{cpf}')
    ? urlTemplate.replace('{cpf}', digits)
    : `${urlTemplate}${urlTemplate.endsWith('/') ? '' : '/'}${digits}`;

  const headerName = process.env.CPF_VALIDATION_AUTH_HEADER || 'Authorization';
  const prefix = process.env.CPF_VALIDATION_AUTH_PREFIX ?? 'Bearer';

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        [headerName]: prefix ? `${prefix} ${apiKey}` : apiKey,
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      return { estado: 'pending', detail: `Provedor respondeu ${res.status}` };
    }
    const data = await res.json();

    const okPath = process.env.CPF_VALIDATION_OK_PATH;
    const okValue = process.env.CPF_VALIDATION_OK_VALUE;
    if (okPath && okValue) {
      const found = pickPath(data, okPath);
      const matches = String(found).toUpperCase() === String(okValue).toUpperCase();
      return { estado: matches ? 'valid' : 'invalid', detail: String(found ?? '') };
    }
    // Sem OK_PATH/OK_VALUE configurados só dá para afirmar que o provedor respondeu — não dá para inventar a semântica do payload dele.
    return { estado: 'pending', detail: 'Configure CPF_VALIDATION_OK_PATH/OK_VALUE para interpretar a resposta.' };
  } catch (err) {
    return { estado: 'pending', detail: err.name === 'AbortError' ? 'Tempo esgotado' : (err.mensagem || err.message) };
  }
}

module.exports = { validarCpf, verificarCpfExternamente, somenteDigitos, formatCpf, maskCpf };
