import { useState, useCallback } from 'react';

// Hook genérico de formulário com validação em tempo real
export function usarFormulario(initialValues, validationRules = {}) {
  const [values, setValues]   = useState(initialValues);
  const [errors, setErrors]   = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Valida um campo específico
  const validateField = useCallback((name, value, allValues = values) => {
    const rules = validationRules[name];
    if (!rules) return '';

    for (const rule of rules) {
      const error = rule(value, allValues);
      if (error) return error;
    }
    return '';
  }, [validationRules, values]);

  // Valida todos os campos
  const validateAll = useCallback(() => {
    const newErrors = {};
    let valid = true;
    for (const name of Object.keys(validationRules)) {
      const error = validateField(name, values[name], values);
      if (error) { newErrors[name] = error; valid = false; }
    }
    setErrors(newErrors);
    setTouched(Object.keys(validationRules).reduce((a, k) => ({ ...a, [k]: true }), {}));
    return valid;
  }, [validateField, validationRules, values]);

  // Atualiza campo e valida em tempo real
  function handleChange(name, value) {
    setValues(prev => {
      const next = { ...prev, [name]: value };
      if (touched[name]) {
        setErrors(prevErr => ({ ...prevErr, [name]: validateField(name, value, next) }));
      }
      return next;
    });
  }

  // Marca campo como tocado ao sair do input
  function handleBlur(name) {
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, values[name]) }));
  }

  async function handleSubmit(onSubmit) {
    if (!validateAll()) return;
    try {
      setSubmitting(true);
      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }

  return {
    values, errors, touched, submitting,
    handleChange, handleBlur, handleSubmit, reset,
    isValid: Object.keys(errors).every(k => !errors[k]),
  };
}

// Regras de validação prontas para usar
export const rules = {
  required: (msg = 'Campo obrigatório') => (v) => !v?.toString().trim() ? msg : '',
  minLength: (n, msg) => (v) => v?.length < n ? (msg || `Mínimo ${n} caracteres`) : '',
  maxLength: (n, msg) => (v) => v?.length > n ? (msg || `Máximo ${n} caracteres`) : '',
  email: (msg = 'E-mail inválido') => (v) =>
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? msg : '',
  min: (n, msg) => (v) => Number(v) < n ? (msg || `Valor mínimo: ${n}`) : '',
  max: (n, msg) => (v) => Number(v) > n ? (msg || `Valor máximo: ${n}`) : '',
  match: (field, msg = 'Os campos não coincidem') => (v, all) =>
    v !== all[field] ? msg : '',
};
