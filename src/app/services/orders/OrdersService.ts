import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  CreateOrderInput,
  CreateOrderInteractor,
  CreateOrderResult,
} from "../../../core/interactors/orders/CreateOrderInteractor";
import { GetOrderInteractor } from "../../../core/interactors/orders/GetOrderInteractor";
import {
  ListOrdersFilter,
  ListOrdersInteractor,
} from "../../../core/interactors/orders/ListOrdersInteractor";
import { InsufficientStockError } from "../../../core/interactors/orders/InsufficientStockError";
import { OrderNotFoundError } from "../../../core/interactors/orders/OrderNotFoundError";
import { PaymentPreferenceCreationError } from "../../../core/interactors/orders/PaymentPreferenceCreationError";
import { ProductNotFoundError } from "../../../core/interactors/orders/ProductNotFoundError";
import { Order } from "../../../core/entities/orders/Order";
import { ApiErrorCode, apiError } from "../../errors/ApiErrorResponse";
import { IdempotencyService } from "../idempotency/IdempotencyService";

@Injectable()
export class OrdersService {
  constructor(
    private readonly createOrderInteractor: CreateOrderInteractor,
    private readonly getOrderInteractor: GetOrderInteractor,
    private readonly listOrdersInteractor: ListOrdersInteractor,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  async create(
    input: CreateOrderInput,
    idempotencyKey: string | undefined,
  ): Promise<CreateOrderResult> {
    if (!idempotencyKey) {
      throw new BadRequestException("Idempotency-Key header is required");
    }

    try {
      return await this.idempotencyService.execute<CreateOrderResult>({
        key: idempotencyKey,
        operation: "create_order",
        request: input,
        execute: () => this.createOrderInteractor.execute(input),
        replay: async (orderId) => {
          const order = await this.getOrderInteractor.execute(orderId);
          return {
            orderId: order.id,
            initPoint: order.mpInitPoint ?? "",
          };
        },
        resourceId: (result) => result.orderId,
      });
    } catch (err) {
      if (err instanceof ProductNotFoundError) {
        throw new NotFoundException(
          apiError(ApiErrorCode.productNotFound, err.message),
        );
      }
      if (err instanceof InsufficientStockError) {
        throw new ConflictException(
          apiError(ApiErrorCode.insufficientStock, err.message),
        );
      }
      if (err instanceof PaymentPreferenceCreationError) {
        throw new BadGatewayException(
          apiError(ApiErrorCode.paymentPreferenceCreationFailed, err.message),
        );
      }
      throw err;
    }
  }

  async get(orderId: string): Promise<Order> {
    try {
      return await this.getOrderInteractor.execute(orderId);
    } catch (err) {
      if (err instanceof OrderNotFoundError) {
        throw new NotFoundException(
          apiError(ApiErrorCode.orderNotFound, err.message),
        );
      }
      throw err;
    }
  }

  list(filter: ListOrdersFilter): Promise<Order[]> {
    return this.listOrdersInteractor.execute(filter);
  }
}
