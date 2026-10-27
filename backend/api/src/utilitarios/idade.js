/** * Idade e a regra de idade mínima da função de TRABALHADOR. ESTE ARQUIVO É A FONTE DA VERDADE DO BACKEND. O aplicativo também valida a idade (para dar feedback imediato), mas es... */

const MIN_WORKER_AGE = 14;
const ADULT_AGE = 18;

const MIN_AGE_MESSAGE =
  'Para criar um perfil de trabalhador no MoviPay, é necessário ter no mínimo 14 anos.';
const GUARDIAN_REQUIRED_MESSAGE =
  'Trabalhadores de 14 a 17 anos precisam informar os dados do responsável legal.';

/** * Converte "YYYY-MM-DD" (ou Date) em partes numéricas, SEM passar por `new Date(string)` — essa conversão interpreta a string como UTC e, em fuso negativo como o do Brasil, joga... */
function parseDateParts(input) {
  if (input instanceof Date && !Number.isNaN(input.getTime())) {
    return { year: input.getFullYear(), month: input.getMonth() + 1, day: input.getDate() };
  }
  const str = String(input || '').trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(str);
  if (iso) return { year: Number(iso[1]), month: Number(iso[2]), day: Number(iso[3]) };

  // Também aceita o formato brasileiro digitado pelo usuário: DD/MM/AAAA
  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(str);
  if (br) return { year: Number(br[3]), month: Number(br[2]), day: Number(br[1]) };

  return null;
}

/** Valida que a data existe de verdade (rejeita 31/02, 30/02/2011 etc.). */
function isRealDate({ year, month, day }) {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

/** * Idade em anos COMPLETOS comparando dia, mês e ano — não é subtração de anos. Quem nasceu em 31/12/2010 só completa 14 em 31/12/2024. @returns {number|null} null se a data for... */
function calcularIdade(birthDate, reference = new Date()) {
  const parts = parseDateParts(birthDate);
  if (!parts || !isRealDate(parts)) return null;

  const refY = reference.getFullYear();
  const refM = reference.getMonth() + 1;
  const refD = reference.getDate();

  let age = refY - parts.year;
  // Ainda não fez aniversário este ano? Então tem um ano a menos.
  if (refM < parts.month || (refM === parts.month && refD < parts.day)) {
    age -= 1;
  }
  if (age < 0) return null; // data no futuro
  return age;
}

/** Valida uma data de nascimento plausível para um cadastro. */
function validarDataNascimento(birthDate) {
  const parts = parseDateParts(birthDate);
  if (!parts || !isRealDate(parts)) {
    return { valid: false, reason: 'Data de nascimento inválida. Use o formato DD/MM/AAAA.' };
  }
  const age = calcularIdade(birthDate);
  if (age === null) {
    return { valid: false, reason: 'A data de nascimento não pode estar no futuro.' };
  }
  if (age > 120) {
    return { valid: false, reason: 'Confira a data de nascimento informada.' };
  }
  const iso = `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
  return { valid: true, age, iso, reason: null };
}

/** * Aplica a regra de idade para a função de trabalhador. @returns {{ allowed: boolean, age: number|null, requiresGuardian: boolean, reason: string|null }} */
function avaliarElegibilidadeTrabalhador(birthDate) {
  const check = validarDataNascimento(birthDate);
  if (!check.valid) {
    return { allowed: false, age: null, requiresGuardian: false, reason: check.reason };
  }
  if (check.age < MIN_WORKER_AGE) {
    return { allowed: false, age: check.age, requiresGuardian: false, reason: MIN_AGE_MESSAGE };
  }
  return {
    allowed: true,
    age: check.age,
    requiresGuardian: check.age < ADULT_AGE,
    reason: null,
  };
}

module.exports = {
  MIN_WORKER_AGE,
  ADULT_AGE,
  MIN_AGE_MESSAGE,
  GUARDIAN_REQUIRED_MESSAGE,
  calcularIdade,
  validarDataNascimento,
  avaliarElegibilidadeTrabalhador,
  parseDateParts,
};
