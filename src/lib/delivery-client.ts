/**
 * Client for the Linoscore Delivery courier API (api.linoscore.com, .NET 9).
 * Auth is per-firm: we log in with the firm's Delivery Customer credentials to
 * get a JWT, then call the deliveries endpoints as that customer.
 *
 * The API uses JsonStringEnumConverter, so enums are string names both ways.
 */

const BASE = process.env.DELIVERY_API_BASE_URL || "https://api.linoscore.com";

export class DeliveryError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "DeliveryError";
  }
}

export type DeliveryAddress = {
  line1: string; line2?: string | null; city: string; state: string;
  postalCode: string; country?: string | null;
};

export type ServiceLevel = "Routine" | "Priority" | "Emergency";
export type DeliveryPriority = "Standard" | "Expedited" | "Rush" | "SameDay";

export interface CreateDeliveryPayload {
  recipientName: string;
  reference?: string;            // the Linos Legal matter number
  pickupAddress: DeliveryAddress;
  dropoffAddress: DeliveryAddress;
  priority?: DeliveryPriority;
  serviceLevel?: ServiceLevel;
  industry?: "Legal";
  submitImmediately?: boolean;
}

export interface DeliveryDetail {
  id: string;
  trackingNumber: string;
  status: string;
  priority: string;
  serviceLevel: string;
  [k: string]: unknown;
}

async function safeErr(res: Response): Promise<string> {
  try {
    const t = await res.text();
    return t?.slice(0, 300) || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

async function login(email: string, password: string): Promise<{ token: string; customerId: string | null }> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new DeliveryError(res.status, res.status === 401 ? "Invalid Linoscore Delivery credentials" : `Delivery login failed (${res.status})`);
  const j = (await res.json()) as { accessToken: string; customerId?: string | null };
  if (!j.accessToken) throw new DeliveryError(502, "Delivery login returned no token");
  return { token: j.accessToken, customerId: j.customerId ?? null };
}

/** Verify a firm's Delivery credentials; returns the customerId on success. */
export async function testDeliveryConnection(email: string, password: string): Promise<{ customerId: string | null }> {
  const { customerId } = await login(email, password);
  return { customerId };
}

export function createDeliveryClient(creds: { email: string; password: string }) {
  let session: Promise<{ token: string; customerId: string | null }> | null = null;
  const auth = () => (session ??= login(creds.email, creds.password));

  async function req(path: string, init: RequestInit & { idempotencyKey?: string } = {}): Promise<Response> {
    const { token } = await auth();
    const { idempotencyKey, headers, ...rest } = init;
    return fetch(`${BASE}${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
        ...(headers as Record<string, string> | undefined),
      },
    });
  }

  return {
    connect: auth,

    async createDelivery(payload: CreateDeliveryPayload, idempotencyKey: string): Promise<DeliveryDetail> {
      const body = {
        recipientName: payload.recipientName,
        reference: payload.reference ?? "",
        pickupAddress: payload.pickupAddress,
        dropoffAddress: payload.dropoffAddress,
        priority: payload.priority ?? "Standard",
        serviceLevel: payload.serviceLevel ?? "Routine",
        industry: payload.industry ?? "Legal",
        submitImmediately: payload.submitImmediately ?? true,
      };
      const res = await req("/api/deliveries", { method: "POST", body: JSON.stringify(body), idempotencyKey });
      if (!res.ok) throw new DeliveryError(res.status, await safeErr(res));
      return (await res.json()) as DeliveryDetail;
    },

    async getDelivery(id: string): Promise<DeliveryDetail> {
      const res = await req(`/api/deliveries/${id}`, { method: "GET" });
      if (!res.ok) throw new DeliveryError(res.status, await safeErr(res));
      return (await res.json()) as DeliveryDetail;
    },

    /** Custody certificate (court-stamped proof) as a binary document. */
    async getCustodyCertificate(id: string): Promise<{ buffer: Buffer; contentType: string }> {
      const res = await req(`/api/deliveries/${id}/custody-certificate`, { method: "GET" });
      if (!res.ok) throw new DeliveryError(res.status, await safeErr(res));
      const buffer = Buffer.from(await res.arrayBuffer());
      return { buffer, contentType: res.headers.get("content-type") || "application/pdf" };
    },
  };
}

export function isDeliveryConfigured(base = BASE) {
  return !!base;
}
