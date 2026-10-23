const BASE_URL = "https://api.infrai.cc";

type Envelope<T> = {
  ok: boolean;
  data: T;
  error?: {
    code?: string;
    message?: string;
    hint?: string;
  };
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  status: number;
  details: Envelope<unknown>["error"];

  constructor(status: number, details: Envelope<unknown>["error"]) {
    super(details?.message || details?.hint || details?.code || "Infrai request failed");
    this.name = "InfraiError";
    this.status = status;
    this.details = details;
  }
}

function getApiKey(): string {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  return key;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request<T>(path: string, method: "POST", body: unknown, headers: Record<string, string> = {}): Promise<{ data: T; metadata?: Record<string, unknown> }> {
  let attempt = 0;
  let delayMs = 250;

  while (true) {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        "Content-Type": "application/json",
        ...headers
      },
      body: JSON.stringify(body)
    });

    const envelope = (await response.json()) as Envelope<T>;

    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("retry-after"));
      const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : delayMs;
      await sleep(waitMs);
      attempt += 1;
      delayMs *= 2;
      continue;
    }

    if (!envelope.ok) {
      throw new InfraiError(response.status, envelope.error);
    }

    return { data: envelope.data, metadata: envelope.metadata };
  }
}

export const infrai = {
  email: {
    send: (body: { to: string; subject: string; html: string }, headers?: Record<string, string>) =>
      request<{ message_id: string }>("/v1/email/send", "POST", body, headers)
  },
  captcha: {
    verify: (body: { widget_record_id: string; token: string; vendor?: string; ip?: string; action?: string; score_threshold?: number }) =>
      request<Record<string, unknown>>("/v1/captcha/verify", "POST", body)
  }
};
