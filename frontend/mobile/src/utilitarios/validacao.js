/** * Validações do formulário — CPF, data e idade. Isto é conveniência para dar retorno imediato a quem está digitando. A decisão real é sempre do backend (e, para a idade mínima,... */

export const MIN_WORKER_AGE = 14;
export const MIN_AGE_MESSAGE =
  'Para criar um perfil de trabalhador no MoviPay, é necessário ter no mínimo 14 anos.';

export function somenteDigitos(value) {
  return String(value || '').replace(/\D/g, '');
}

/** Máscara progressiva: 000.000.000-00 */
export function formatCpfCampoEntrada(value) {
  const d = somenteDigitos(value).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/** Máscara progressiva: DD/MM/AAAA */
export function formatDateCampoEntrada(value) {
  const d = somenteDigitos(value).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** Mesmo algoritmo do backend: módulo 11 sobre os dois dígitos verificadores. */
export function cpfIsValid(value) {
  const cpf = somenteDigitos(value);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const digit = (slice, factor) => {
    let total = 0;
    for (let i = 0; i < slice.length; i++) total += Number(slice[i]) * (factor - i);
    const rest = (total * 10) % 11;
    return rest >= 10 ? 0 : rest;
  };

  return digit(cpf.slice(0, 9), 10) === Number(cpf[9]) && digit(cpf.slice(0, 10), 11) === Number(cpf[10]);
}

/** "DD/MM/AAAA" -> "AAAA-MM-DD" (null se a data não existir de verdade). */
export function brDateToIso(value) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(value || '').trim());
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) {
    return null;
  }
  return `${yyyy}-${mm}-${dd}`;
}

export function isoToBrDate(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ''));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

/** * Idade em anos COMPLETOS, comparando dia, mês e ano. Não usa `new Date(string)` de propósito: essa conversão interpreta a data como UTC e, em fuso negativo como o do Brasil, jo... */
export function calcularIdade(isoDate, reference = new Date()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(isoDate || ''));
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);

  let age = reference.getFullYear() - year;
  const refMonth = reference.getMonth() + 1;
  const refDay = reference.getDate();
  if (refMonth < month || (refMonth === month && refDay < day)) age -= 1;

  return age < 0 ? null : age;
}

/** Regra de elegibilidade espelhada do backend (para feedback imediato). */
export function evaluateWorkerAge(isoDate) {
  const age = calcularIdade(isoDate);
  if (age === null) return { age: null, allowed: false, requiresGuardian: false, mensagem: 'Data de nascimento inválida.' };
  if (age < MIN_WORKER_AGE) return { age, allowed: false, requiresGuardian: false, mensagem: MIN_AGE_MESSAGE };
  return { age, allowed: true, requiresGuardian: age < 18, mensagem: null };
}

export function formatPhoneCampoEntrada(value) {
  const d = somenteDigitos(value).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
