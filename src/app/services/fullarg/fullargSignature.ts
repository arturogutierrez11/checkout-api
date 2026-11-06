import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Fullarg firma cada webhook: `X-3PL-Signature: sha256=` + HMAC-SHA256 hex de
 * `"{X-3PL-Timestamp}.{body crudo}"` con el secret del endpoint.
 */
export function isValidFullargSignature(input: {
  secret: string | undefined;
  signature: string | undefined;
  timestamp: string | undefined;
  rawBody: Buffer | undefined;
}): boolean {
  if (!input.secret || !input.signature || !input.timestamp || !input.rawBody) {
    return false;
  }

  const expected = createHmac("sha256", input.secret)
    .update(`${input.timestamp}.`)
    .update(input.rawBody)
    .digest("hex");

  const received = input.signature.trim().replace(/^sha256=/i, "");

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}
