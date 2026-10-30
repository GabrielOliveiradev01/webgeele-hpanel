import { env } from "@/lib/env";

export type AsaasCustomerInput = {
  name: string;
  email: string;
  cpfCnpj?: string;
  phone?: string;
  mobilePhone?: string;
  externalReference?: string;
};

export type AsaasCreditCard = {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
};

export type AsaasCreditCardHolderInfo = {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  addressComplement?: string;
  phone?: string;
  mobilePhone?: string;
};

export type AsaasSubscriptionInput = {
  customer: string;
  billingType: "BOLETO" | "CREDIT_CARD" | "PIX" | "UNDEFINED";
  value: number;
  nextDueDate: string;
  cycle: "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "SEMIANNUALLY" | "YEARLY";
  description?: string;
  externalReference?: string;
  creditCard?: AsaasCreditCard;
  creditCardHolderInfo?: AsaasCreditCardHolderInfo;
  creditCardToken?: string;
  remoteIp?: string;
};

type AsaasErrorBody = {
  errors?: Array<{ code?: string; description?: string }>;
};

async function asaasFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${env.asaasApiUrl().replace(/\/$/, "")}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      access_token: env.asaasApiKey(),
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await response.text();
  const body = text ? (JSON.parse(text) as T & AsaasErrorBody) : ({} as T & AsaasErrorBody);

  if (!response.ok) {
    const detail =
      body.errors?.map((error) => error.description).filter(Boolean).join("; ") ||
      text ||
      response.statusText;
    throw new Error(`Asaas ${response.status}: ${detail}`);
  }

  return body;
}

export function createAsaasClient() {
  return {
    getBalance() {
      return asaasFetch<{ balance: number }>("/finance/balance");
    },
    createCustomer(input: AsaasCustomerInput) {
      return asaasFetch<{ id: string } & AsaasCustomerInput>("/customers", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    getCustomer(id: string) {
      return asaasFetch<Record<string, unknown>>(`/customers/${id}`);
    },
    findCustomersByEmail(email: string) {
      return asaasFetch<{ data: Array<{ id: string; email?: string }> }>(
        `/customers?email=${encodeURIComponent(email)}&limit=10`,
      );
    },
    createSubscription(input: AsaasSubscriptionInput) {
      return asaasFetch<{
        id: string;
        status: string;
        value: number;
        nextDueDate: string;
        cycle: string;
        creditCard?: { creditCardToken?: string };
        paymentLink?: string;
        invoiceUrl?: string;
      }>("/subscriptions", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    getSubscription(id: string) {
      return asaasFetch<{
        id: string;
        status: string;
        value: number;
        nextDueDate: string;
        cycle: string;
        customer: string;
      }>(`/subscriptions/${id}`);
    },
    listPaymentsBySubscription(subscriptionId: string) {
      return asaasFetch<{
        data: Array<{
          id: string;
          status: string;
          value: number;
          dueDate: string;
          paymentDate?: string;
          invoiceUrl?: string;
          bankSlipUrl?: string;
        }>;
      }>(`/subscriptions/${subscriptionId}/payments?limit=20`);
    },
    createPayment(input: {
      customer: string;
      billingType: "BOLETO" | "PIX" | "CREDIT_CARD" | "UNDEFINED";
      value: number;
      dueDate: string;
      description?: string;
      externalReference?: string;
      creditCard?: AsaasCreditCard;
      creditCardHolderInfo?: AsaasCreditCardHolderInfo;
      creditCardToken?: string;
      remoteIp?: string;
    }) {
      return asaasFetch<{
        id: string;
        status: string;
        value: number;
        invoiceUrl?: string;
        bankSlipUrl?: string;
        invoiceNumber?: string;
        billingType?: string;
        creditCard?: { creditCardToken?: string };
      }>("/payments", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    getPayment(id: string) {
      return asaasFetch<{
        id: string;
        status: string;
        value: number;
        invoiceUrl?: string;
        bankSlipUrl?: string;
        billingType?: string;
        externalReference?: string;
      }>(`/payments/${id}`);
    },
    getPixQrCode(paymentId: string) {
      return asaasFetch<{
        encodedImage?: string;
        payload?: string;
        expirationDate?: string;
      }>(`/payments/${paymentId}/pixQrCode`);
    },
  };
}

export type LocalSubscriptionStatus =
  | "pending"
  | "active"
  | "past_due"
  | "canceled"
  | "expired"
  | "blocked";

export function mapAsaasSubscriptionStatus(status: string): LocalSubscriptionStatus {
  switch (status.toUpperCase()) {
    case "ACTIVE":
      return "active";
    case "EXPIRED":
      return "expired";
    case "INACTIVE":
      return "blocked";
    default:
      return "pending";
  }
}

export function mapAsaasPaymentToAccountStatus(
  event: string,
): "active" | "past_due" | "blocked" | "canceled" | null {
  switch (event) {
    case "PAYMENT_CONFIRMED":
    case "PAYMENT_RECEIVED":
    case "SUBSCRIPTION_CREATED":
      return "active";
    case "PAYMENT_OVERDUE":
      return "past_due";
    case "PAYMENT_DELETED":
    case "SUBSCRIPTION_DELETED":
    case "SUBSCRIPTION_INACTIVATED":
      return "blocked";
    default:
      return null;
  }
}
