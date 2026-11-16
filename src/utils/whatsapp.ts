export function formatWhatsAppDisplay(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  }
  if (clean.length === 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  }
  return phone;
}

export function buildWhatsAppLink(
  phone: string,
  businessName?: string,
  customMessage?: string
): string {
  let clean = phone.replace(/\D/g, '');
  
  // If user included 55 prefix already
  if (clean.startsWith('55') && clean.length > 11) {
    clean = clean.slice(2);
  }

  const defaultText = customMessage || (businessName
    ? `Olá, ${businessName}! Encontrei seu contato pelo Guia Comercial Ninho Verde II e gostaria de saber mais sobre seu produto ou serviço.`
    : `Olá! Encontrei seu contato pelo Guia Comercial Ninho Verde II e gostaria de saber mais sobre seu produto ou serviço.`);

  return `https://wa.me/55${clean}?text=${encodeURIComponent(defaultText)}`;
}
