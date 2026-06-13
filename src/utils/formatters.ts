export const formatarTelefone = (value: string) => {
  if (!value) return '';
  
  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length === 0) return '';
  if (numbers.length <= 2) return `(${numbers}`;
  if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  
  // Limita a 11 dígitos e aplica a máscara (XX) XXXXX-XXXX
  const truncated = numbers.slice(0, 11);
  return `(${truncated.slice(0, 2)}) ${truncated.slice(2, 7)}-${truncated.slice(7)}`;
};
