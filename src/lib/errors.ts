// Mensagens que chegam ao cliente não citam fornecedores (Assas, servidor de e-mail).
// O detalhe técnico completo continua no log do servidor.
export function publicErrorMessage(err: unknown, fallback: string) {
  if (!(err instanceof Error)) return fallback;
  const message = err.message;

  const payment = message.match(/^Asaas \d+: ([\s\S]*)$/);
  if (payment) {
    console.error(message);
    const detail = payment[1].trim();
    // Descrições do gateway já vêm em português; JSON cru não serve ao cliente.
    return detail && !detail.startsWith("{") ? detail : "Não foi possível processar o pagamento.";
  }

  if (/stalwart/i.test(message)) {
    console.error(message);
    return "O servidor de e-mail não respondeu. Tente novamente em instantes.";
  }

  return message;
}
