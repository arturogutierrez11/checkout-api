import { createHmac } from "node:crypto";
import { isValidFullargSignature } from "./fullargSignature";

const secret = "whsec_test";
const timestamp = "1767225600";
const rawBody = Buffer.from('{"external_order_id":"abc","event":"shipment.dispatched"}');

function sign(ts: string, body: Buffer, key = secret): string {
  return `sha256=${createHmac("sha256", key)
    .update(`${ts}.`)
    .update(body)
    .digest("hex")}`;
}

describe("isValidFullargSignature", () => {
  it("acepta una firma correcta", () => {
    expect(
      isValidFullargSignature({
        secret,
        signature: sign(timestamp, rawBody),
        timestamp,
        rawBody,
      }),
    ).toBe(true);
  });

  it("rechaza si el body fue alterado", () => {
    expect(
      isValidFullargSignature({
        secret,
        signature: sign(timestamp, rawBody),
        timestamp,
        rawBody: Buffer.from('{"external_order_id":"otra"}'),
      }),
    ).toBe(false);
  });

  it("rechaza si firmaron con otro secret", () => {
    expect(
      isValidFullargSignature({
        secret,
        signature: sign(timestamp, rawBody, "otro"),
        timestamp,
        rawBody,
      }),
    ).toBe(false);
  });

  it("rechaza todo si no hay secret configurado", () => {
    expect(
      isValidFullargSignature({
        secret: undefined,
        signature: sign(timestamp, rawBody),
        timestamp,
        rawBody,
      }),
    ).toBe(false);
  });

  it("rechaza si falta el timestamp o la firma", () => {
    expect(
      isValidFullargSignature({
        secret,
        signature: undefined,
        timestamp,
        rawBody,
      }),
    ).toBe(false);
  });
});
