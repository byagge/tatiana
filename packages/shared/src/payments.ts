import { randomUUID } from "node:crypto";
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProvider,
  PaymentStatus,
} from "./types.js";

export class StubPaymentProvider implements PaymentProvider {
  readonly name = "stub";

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const id = `stub_${randomUUID()}`;
    const sep = input.returnUrl.includes("?") ? "&" : "?";
    const confirmationUrl = `${input.returnUrl}${sep}payment=stub&id=${id}&amount=${input.amountRub}`;
    console.info("[payments:stub] createPayment", {
      amountRub: input.amountRub,
      description: input.description,
      confirmationUrl,
    });
    return {
      id,
      confirmationUrl,
      status: "pending",
      externalId: id,
    };
  }

  async getPaymentStatus(externalId: string): Promise<PaymentStatus> {
    console.info("[payments:stub] getPaymentStatus", externalId);
    return "pending";
  }
}

/**
 * YooKassa API v3 — ready to enable with YOOKASSA_SHOP_ID + YOOKASSA_SECRET_KEY.
 * Docs: https://yookassa.ru/developers/api
 */
export class YooKassaProvider implements PaymentProvider {
  readonly name = "yookassa";

  constructor(
    private readonly shopId: string,
    private readonly secretKey: string
  ) {
    if (!shopId || !secretKey) {
      throw new Error("YooKassa credentials are required");
    }
  }

  private authHeader(): string {
    return `Basic ${Buffer.from(`${this.shopId}:${this.secretKey}`).toString("base64")}`;
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const idempotenceKey = randomUUID();
    const body = {
      amount: {
        value: input.amountRub.toFixed(2),
        currency: "RUB",
      },
      capture: true,
      confirmation: {
        type: "redirect",
        return_url: input.returnUrl,
      },
      description: input.description.slice(0, 128),
      metadata: input.metadata ?? {},
    };

    const res = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        Authorization: this.authHeader(),
        "Content-Type": "application/json",
        "Idempotence-Key": idempotenceKey,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`YooKassa createPayment failed: ${res.status} ${text}`);
    }

    const data = (await res.json()) as {
      id: string;
      status: string;
      confirmation?: { confirmation_url?: string };
    };

    return {
      id: data.id,
      externalId: data.id,
      confirmationUrl: data.confirmation?.confirmation_url ?? input.returnUrl,
      status: mapYooStatus(data.status),
    };
  }

  async getPaymentStatus(externalId: string): Promise<PaymentStatus> {
    const res = await fetch(
      `https://api.yookassa.ru/v3/payments/${externalId}`,
      {
        headers: { Authorization: this.authHeader() },
      }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`YooKassa getPayment failed: ${res.status} ${text}`);
    }
    const data = (await res.json()) as { status: string };
    return mapYooStatus(data.status);
  }
}

function mapYooStatus(status: string): PaymentStatus {
  if (status === "succeeded") return "succeeded";
  if (status === "canceled") return "canceled";
  return "pending";
}

export function createPaymentProvider(env: {
  PAYMENT_PROVIDER?: string;
  YOOKASSA_SHOP_ID?: string;
  YOOKASSA_SECRET_KEY?: string;
}): PaymentProvider {
  if (env.PAYMENT_PROVIDER === "yookassa") {
    return new YooKassaProvider(
      env.YOOKASSA_SHOP_ID ?? "",
      env.YOOKASSA_SECRET_KEY ?? ""
    );
  }
  return new StubPaymentProvider();
}
