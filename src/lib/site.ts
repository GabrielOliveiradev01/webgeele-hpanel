import { MAILBOX_PLANS, type MailboxPlan } from "@/lib/billing/mailbox-pricing";
import { MIGRATION_PROVIDERS } from "@/lib/transfer/providers";

// URL pública do painel (NEXT_PUBLIC_SITE_URL no Netlify), usada em canonical, sitemap e OG.
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
  /\/+$/,
  "",
);

export const siteName = "WebGeele";

const lowestMonthlyCents = Math.min(
  ...MAILBOX_PLANS.map((plan) => Math.round(plan.annualCents / 12)),
);

export const startingPriceLabel = (lowestMonthlyCents / 100).toLocaleString("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const brl = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function planPriceText(plan: MailboxPlan) {
  return `${plan.name} (${plan.storageLabel} por caixa): ${brl(Math.round(plan.annualCents / 12))}/mês no plano anual (${brl(plan.annualCents)} por ano) ou ${brl(plan.monthlyCents)} no plano mensal`;
}

export const migrationProviderNames = MIGRATION_PROVIDERS.map((provider) => provider.label);

// Perguntas frequentes: aparecem na página de cadastro, no FAQPage (schema.org) e no llms.txt.
export const faqs: Array<{ question: string; answer: string }> = [
  {
    question: "Quanto custa uma caixa de e-mail profissional na WebGeele?",
    answer: `A partir de ${startingPriceLabelFor()}/mês por caixa no plano anual. ${MAILBOX_PLANS.map(planPriceText).join("; ")}.`,
  },
  {
    question: "Posso usar o meu próprio domínio no e-mail?",
    answer:
      "Sim. Você adiciona o seu domínio no painel e o e-mail fica no formato voce@suaempresa.com.br. O painel mostra os registros de DNS de e-mail (MX, SPF e DKIM) para configurar no provedor do domínio. Não há limite de domínios por conta.",
  },
  {
    question: "Qual a diferença entre o plano mensal e o anual?",
    answer:
      "No mensal a cobrança é feita todo mês no cartão de crédito. No anual você paga uma vez por ano e o valor mensal fica bem menor.",
  },
  {
    question: "Consigo trazer os e-mails da minha conta antiga?",
    answer: `Sim. A ferramenta de migração copia mensagens e pastas da conta antiga para a caixa WebGeele sem apagar nada na origem. Provedores aceitos: ${migrationProviderNames.join(", ")}.`,
  },
  {
    question: "Como acesso o meu e-mail depois de comprar?",
    answer:
      "Depois de assinar, você cria as caixas no painel e acessa as mensagens pelo webmail da WebGeele. O mesmo painel reúne domínios, faturas e suporte.",
  },
  {
    question: "Quais formas de pagamento são aceitas?",
    answer:
      "As caixas de e-mail são assinadas no cartão de crédito, no plano mensal ou anual.",
  },
];

function startingPriceLabelFor() {
  return brl(Math.min(...MAILBOX_PLANS.map((plan) => Math.round(plan.annualCents / 12))));
}

export const seoDescription = `Compre sua caixa de e-mail profissional com domínio próprio a partir de ${startingPriceLabel}/mês. Webmail, antispam, DNS configurado e migração do seu e-mail antigo sem perder mensagens.`;

export const seoKeywords = [
  "comprar caixa de e-mail",
  "comprar caixa de entrada",
  "e-mail profissional",
  "e-mail corporativo",
  "e-mail com domínio próprio",
  "e-mail para empresa",
  "hospedagem de e-mail",
  "caixa postal profissional",
  "webmail",
  "migração de e-mail",
];

// Dados estruturados (schema.org) com os preços reais dos planos.
export function productJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: siteName,
        url: siteUrl,
        logo: `${siteUrl}/icon.svg`,
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
      {
        "@type": "Product",
        name: "Caixa de e-mail profissional WebGeele",
        description: seoDescription,
        brand: { "@id": `${siteUrl}/#organization` },
        offers: MAILBOX_PLANS.flatMap((plan) => [
          {
            "@type": "Offer",
            name: `${plan.name} anual · ${plan.storageLabel}`,
            price: (plan.annualCents / 100).toFixed(2),
            priceCurrency: "BRL",
            availability: "https://schema.org/InStock",
            url: `${siteUrl}/cadastro`,
          },
          {
            "@type": "Offer",
            name: `${plan.name} mensal · ${plan.storageLabel}`,
            price: (plan.monthlyCents / 100).toFixed(2),
            priceCurrency: "BRL",
            availability: "https://schema.org/InStock",
            url: `${siteUrl}/cadastro`,
          },
        ]),
      },
    ],
  };
}
