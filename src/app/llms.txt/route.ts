import { MAILBOX_PLANS } from "@/lib/billing/mailbox-pricing";
import { faqs, migrationProviderNames, planPriceText, seoDescription, siteUrl } from "@/lib/site";

export const dynamic = "force-static";

// Resumo em texto simples para assistentes de IA (padrão llms.txt).
export function GET() {
  const body = `# WebGeele — e-mail profissional com domínio próprio

> ${seoDescription}

A WebGeele vende caixas de e-mail profissional para empresas e profissionais no Brasil. O cliente usa o próprio domínio (voce@suaempresa.com.br), cria as caixas no painel e acessa pelo webmail. O mesmo painel mostra os registros de DNS de e-mail de cada domínio, as faturas e o suporte. A WebGeele não registra nem transfere domínios: o cliente usa um domínio que já tem.

## Planos e preços (por caixa)

${MAILBOX_PLANS.map((plan) => `- ${planPriceText(plan)}`).join("\n")}

Pagamento das caixas: cartão de crédito, no plano mensal ou anual. Domínios por conta: sem limite.

## Migração de e-mail

Copia mensagens e pastas da conta antiga para a WebGeele sem apagar nada na origem. Provedores aceitos: ${migrationProviderNames.join(", ")}.

## Perguntas frequentes

${faqs.map((faq) => `### ${faq.question}\n\n${faq.answer}`).join("\n\n")}

## Links

- [Comprar caixa de e-mail / criar conta](${siteUrl}/cadastro): cadastro e preços
- [Entrar no painel](${siteUrl}/login): área do cliente
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
