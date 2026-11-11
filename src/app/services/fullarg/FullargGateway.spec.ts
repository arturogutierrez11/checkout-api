import { FullargGateway } from "./FullargGateway";
import { env } from "../../../config/env";

const input = {
  externalOrderId: "1408365d-4ef8-4283-8597-ca33e4b2dc7d",
  idempotencyKey: "rituo-1408365d-4ef8-4283-8597-ca33e4b2dc7d",
  sku: "TARJET001",
  quantity: 2,
  buyer: { name: "Ana Pérez", email: "ana@example.com", phone: "+5491100000000" },
  shipping: {
    address: "Av. Corrientes 1234",
    city: "CABA",
    state: "CABA",
    postalCode: "1043",
  },
};

function mockFetch(status: number, body: unknown): jest.Mock {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe("FullargGateway.createOrder", () => {
  beforeAll(() => {
    env.fullargApiKey = "fullarg_sk_test";
  });

  it("lee la respuesta envuelta en `message` (formato real de Fullarg)", async () => {
    const fetchMock = mockFetch(200, {
      message: {
        ok: 1,
        created: true,
        already_exists: false,
        sales_order: "SAL-ORD-2026-01891",
        status: "Approved",
        external_order_id: input.externalOrderId,
        idempotent_replay: false,
      },
    });

    const result = await new FullargGateway().createOrder(input);

    expect(result).toEqual({
      salesOrder: "SAL-ORD-2026-01891",
      status: "Approved",
      alreadyExisted: false,
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)["Idempotency-Key"]).toBe(
      input.idempotencyKey,
    );
    expect(JSON.parse(init.body as string).items).toEqual([
      { sku: "TARJET001", qty: 2 },
    ]);
  });

  it("manda shipping_method solo cuando se eligió un operador", async () => {
    const ok = {
      message: { ok: 1, sales_order: "SAL-ORD-2026-01891", status: "Approved" },
    };

    const withMethod = mockFetch(200, ok);
    await new FullargGateway().createOrder({ ...input, shippingMethod: "flex" });
    const [, a] = withMethod.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(a.body as string).shipping_method).toBe("flex");

    const withoutMethod = mockFetch(200, ok);
    await new FullargGateway().createOrder(input);
    const [, b] = withoutMethod.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(b.body as string)).not.toHaveProperty("shipping_method");
  });

  it("manda las notas de entrega como `note`, recortadas a 500 caracteres", async () => {
    const ok = {
      message: { ok: 1, sales_order: "SAL-ORD-2026-01891", status: "Approved" },
    };

    const withNote = mockFetch(200, ok);
    await new FullargGateway().createOrder({
      ...input,
      note: "x".repeat(600),
    });
    const [, a] = withNote.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(a.body as string).note).toHaveLength(500);

    const withoutNote = mockFetch(200, ok);
    await new FullargGateway().createOrder(input);
    const [, b] = withoutNote.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(b.body as string)).not.toHaveProperty("note");
  });

  it("marca el reintento como ya existente", async () => {
    mockFetch(200, {
      message: {
        ok: 1,
        created: false,
        sales_order: "SAL-ORD-2026-01891",
        status: "Approved",
        idempotent_replay: true,
      },
    });

    const result = await new FullargGateway().createOrder(input);

    expect(result.alreadyExisted).toBe(true);
  });

  it("devuelve el mensaje de error de Fullarg cuando rechaza", async () => {
    mockFetch(400, {
      message: {
        error: { code: "validation_error", message: "SKU TARJET001 no existe en tu catálogo" },
      },
      exc_type: "ValidationError",
    });

    await expect(new FullargGateway().createOrder(input)).rejects.toThrow(
      /validation_error.*SKU TARJET001 no existe/,
    );
  });
});
