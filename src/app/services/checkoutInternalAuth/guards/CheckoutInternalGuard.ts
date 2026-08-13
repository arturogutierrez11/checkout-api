import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { env } from "../../../../config/env";

@Injectable()
export class CheckoutInternalGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const configuredKey = env.checkoutInternalApiKey;

    if (!configuredKey) {
      throw new UnauthorizedException(
        "checkout internal key is not configured",
      );
    }

    const request = context.switchToHttp().getRequest<Request>();
    const headerKey = request.headers["x-internal-api-key"];
    const providedKey = Array.isArray(headerKey) ? headerKey[0] : headerKey;

    if (providedKey !== configuredKey) {
      throw new UnauthorizedException("invalid internal api key");
    }

    return true;
  }
}
