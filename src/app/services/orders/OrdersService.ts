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
import { CancelOrderInteractor } from "../../../core/interactors/orders/CancelOrderInteractor";
import { MarkOrderShippedInteractor } from "../../../core/interactors/orders/MarkOrderShippedInteractor";
import { ResyncOrderInteractor } from "../../../core/interactors/orders/ResyncOrderInteractor";
import { SetInvoiceStatusInteractor } from "../../../core/interactors/orders/SetInvoiceStatusInteractor";
import { SetShippingStatusInteractor } from "../../../core/interactors/orders/SetShippingStatusInteractor";
import { InsufficientStockError } from "../../../core/interactors/orders/InsufficientStockError";
import { OrderNotCancellableError } from "../../../core/interactors/orders/OrderNotCancellableError";
import { OrderNotFoundError } from "../../../core/interactors/orders/OrderNotFoundError";
import { OrderNotShippableError } from "../../../core/interactors/orders/OrderNotShippableError";
import { PaymentPreferenceCreationError } from "../../../core/interactors/orders/PaymentPreferenceCreationError";
import { ProductNotFoundError } from "../../../core/interactors/orders/ProductNotFoundError";
import {
  Order,
  MarkShippedData,
  ShippingStatus,
} from "../../../core/entities/orders/Order";
import { ApiErrorCode, apiError } from "../../errors/ApiErrorResponse";
import { IdempotencyService } from "../idempotency/IdempotencyService";

@Injectable()
export class OrdersService {
  constructor(
    private readonly createOrderInteractor: CreateOrderInteractor,
    private readonly getOrderInteractor: GetOrderInteractor,
    private readonly listOrdersInteractor: ListOrdersInteractor,
    private readonly cancelOrderInteractor: CancelOrderInteractor,
    private readonly markOrderShippedInteractor: MarkOrderShippedInteractor,
    private readonly resyncOrderInteractor: ResyncOrderInteractor,
    private readonly setShippingStatusInteractor: SetShippingStatusInteractor,
    private readonly setInvoiceStatusInteractor: SetInvoiceStatusInteractor,
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

  async cancel(orderId: string): Promise<Order> {
    try {
      return await this.cancelOrderInteractor.execute(orderId);
    } catch (err) {
      if (err instanceof OrderNotFoundError) {
        throw new NotFoundException(
          apiError(ApiErrorCode.orderNotFound, err.message),
        );
      }
      if (err instanceof OrderNotCancellableError) {
        throw new ConflictException(
          apiError(ApiErrorCode.orderNotCancellable, err.message),
        );
      }
      throw err;
    }
  }

  async ship(orderId: string, data: MarkShippedData): Promise<Order> {
    try {
      return await this.markOrderShippedInteractor.execute(orderId, data);
    } catch (err) {
      if (err instanceof OrderNotFoundError) {
        throw new NotFoundException(
          apiError(ApiErrorCode.orderNotFound, err.message),
        );
      }
      if (err instanceof OrderNotShippableError) {
        throw new ConflictException(
          apiError(ApiErrorCode.orderNotShippable, err.message),
        );
      }
      throw err;
    }
  }

  async resync(orderId: string): Promise<Order> {
    try {
      return await this.resyncOrderInteractor.execute(orderId);
    } catch (err) {
      if (err instanceof OrderNotFoundError) {
        throw new NotFoundException(
          apiError(ApiErrorCode.orderNotFound, err.message),
        );
      }
      throw err;
    }
  }

  async setShippingStatus(
    orderId: string,
    status: ShippingStatus,
  ): Promise<Order> {
    try {
      return await this.setShippingStatusInteractor.execute(orderId, status);
    } catch (err) {
      if (err instanceof OrderNotFoundError) {
        throw new NotFoundException(
          apiError(ApiErrorCode.orderNotFound, err.message),
        );
      }
      throw err;
    }
  }

  async setInvoiceStatus(orderId: string, invoiced: boolean): Promise<Order> {
    try {
      return await this.setInvoiceStatusInteractor.execute(orderId, invoiced);
    } catch (err) {
      if (err instanceof OrderNotFoundError) {
        throw new NotFoundException(
          apiError(ApiErrorCode.orderNotFound, err.message),
        );
      }
      throw err;
    }
  }
}
