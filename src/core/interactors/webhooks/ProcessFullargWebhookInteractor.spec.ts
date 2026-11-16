import { IOrdersRepository } from "../../adapters/repositories/orders/IOrdersRepository";
import { IOrderEmailSender } from "../../adapters/services/orderEmail/IOrderEmailSender";
import { Order } from "../../entities/orders/Order";
import { ProcessFullargWebhookInteractor } from "./ProcessFullargWebhookInteractor";

const ORDER_ID = "1408365d-4ef8-4283-8597-ca33e4b2dc7d";

function build(overrides: Partial<Order> = {}, claim = true) {
  const order = {
    id: ORDER_ID,
    status: "approved",
    shippingStatus: "pending_dispatch",
    fullargSalesOrder: "SAL-ORD-2026-01891",
    shippingCarrier: "Andreani",
    shippingTrackingNumber: "360002345678901",
    ...overrides,
  } as Order;

  const orders = {
    findByFullargSalesOrder: jest.fn().mockResolvedValue(order),
    getById: jest.fn().mockResolvedValue(order),
    updateFullargStatus: jest.fn().mockResolvedValue(undefined),
    setShippingStatus: jest.fn().mockResolvedValue(true),
    claimShippedEmail: jest.fn().mockResolvedValue(claim),
    releaseShippedEmail: jest.fn().mockResolvedValue(undefined),
  };
  const events = { append: jest.fn().mockResolvedValue(undefined) };
  const sender = { sendOrderShipped: jest.fn().mockResolvedValue(undefined) };

  const interactor = new ProcessFullargWebhookInteractor(
    orders as unknown as IOrdersRepository,
    events,
    sender as unknown as IOrderEmailSender,
  );

  return { interactor, orders, events, sender, order };
}

const dispatched = {
  event: "shipment.dispatched",
  eventId: "evt-1",
  body: {
    sales_order: "SAL-ORD-2026-01891",
    carrier: "Andreani",
    tracking_number: "360002345678901",
  },
};

describe("ProcessFullargWebhookInteractor — mail de seguimiento", () => {
  it("manda el mail al despachar y lo registra", async () => {
    const { interactor, orders, sender, events } = build();

    await interactor.execute(dispatched);

    expect(orders.updateFullargStatus).toHaveBeenCalledWith(
      ORDER_ID,
      "shipment.dispatched",
      {
        carrier: "Andreani",
        trackingNumber: "360002345678901",
        trackingUrl: null,
      },
    );
    expect(sender.sendOrderShipped).toHaveBeenCalledTimes(1);
    expect(events.append).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "shipped_email_sent" }),
    );
  });

  it("no lo repite si ya se mandó (reintentos o varios eventos)", async () => {
    const { interactor, sender } = build({}, false);

    await interactor.execute(dispatched);

    expect(sender.sendOrderShipped).not.toHaveBeenCalled();
  });

  it("no manda nada si la orden no está aprobada", async () => {
    const { interactor, orders, sender } = build({ status: "cancelled" });

    await interactor.execute(dispatched);

    expect(orders.claimShippedEmail).not.toHaveBeenCalled();
    expect(sender.sendOrderShipped).not.toHaveBeenCalled();
  });

  it("si el mail falla, no rompe el webhook y devuelve el turno para reintentar", async () => {
    const { interactor, orders, sender, events } = build();
    sender.sendOrderShipped.mockRejectedValue(new Error("Resend caído"));

    await expect(interactor.execute(dispatched)).resolves.toBeUndefined();

    expect(orders.releaseShippedEmail).toHaveBeenCalledWith(ORDER_ID);
    expect(events.append).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "shipped_email_failed",
        payload: { message: "Resend caído" },
      }),
    );
  });

  it("encuentra el seguimiento anidado y aunque venga como número", async () => {
    const { interactor, orders } = build();

    await interactor.execute({
      event: "shipment.dispatched",
      eventId: "evt-2",
      body: {
        data: {
          sales_order: "SAL-ORD-2026-01891",
          shipment: {
            courier: "Correo Argentino",
            tracking_number: 360002345678901,
            tracking_url: "https://ejemplo.com/seguimiento/360002345678901",
          },
        },
      },
    });

    expect(orders.updateFullargStatus).toHaveBeenCalledWith(
      ORDER_ID,
      "shipment.dispatched",
      {
        carrier: "Correo Argentino",
        trackingNumber: "360002345678901",
        trackingUrl: "https://ejemplo.com/seguimiento/360002345678901",
      },
    );
  });
});
