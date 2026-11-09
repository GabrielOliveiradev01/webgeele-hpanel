// Mensagens do Supabase Auth chegam em inglês; traduzimos as que o cliente vê.
const MESSAGES: Array<[RegExp, string]> = [
  [/invalid login credentials/i, "E-mail ou senha incorretos."],
  [/email not confirmed/i, "Confirme seu e-mail antes de entrar. Procure a mensagem da WebGeele na sua caixa de entrada."],
  [/user already registered/i, "Já existe uma conta com este e-mail. Entre ou redefina sua senha."],
  [/password should be at least/i, "A senha precisa ter pelo menos 8 caracteres."],
  [/new password should be different/i, "A nova senha precisa ser diferente da atual."],
  [/(rate limit|security purposes|too many)/i, "Muitas tentativas seguidas. Aguarde um minuto e tente de novo."],
  [/(expired|invalid).*(link|token|otp)|(otp|token).*(expired|invalid)/i, "Este link expirou ou já foi usado. Peça um novo."],
  [/auth session missing/i, "Sua sessão expirou. Peça um novo link de redefinição."],
  [/unable to validate email|invalid email/i, "Informe um e-mail válido."],
];

export function authErrorMessage(message: string | null | undefined) {
  if (!message) return "Não foi possível concluir. Tente novamente.";
  return MESSAGES.find(([pattern]) => pattern.test(message))?.[1] ?? message;
}
