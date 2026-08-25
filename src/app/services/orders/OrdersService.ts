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
import { DownloadShippingLabelInteractor } from "../../../core/interactors/orders/DownloadShippingLabelInteractor";
import { GenerateShippingLabelInteractor } from "../../../core/interactors/orders/GenerateShippingLabelInteractor";
import { MarkOrderShippedInteractor } from "../../../core/interactors/orders/MarkOrderShippedInteractor";
import { ResyncOrderInteractor } from "../../../core/interactors/orders/ResyncOrderInteractor";
import { ReturnOrderInteractor } from "../../../core/interactors/orders/ReturnOrderInteractor";
import { SetInvoiceStatusInteractor } from "../../../core/interactors/orders/SetInvoiceStatusInteractor";
import { SetShippingStatusInteractor } from "../../../core/interactors/orders/SetShippingStatusInteractor";
import { InsufficientStockError } from "../../../core/interactors/orders/InsufficientStockError";
import { OrderNotCancellableError } from "../../../core/interactors/orders/OrderNotCancellableError";
import { OrderNotFoundError } from "../../../core/interactors/orders/OrderNotFoundError";
import { OrderNotReturnableError } from "../../../core/interactors/orders/OrderNotReturnableError";
import { OrderNotShippableError } from "../../../core/interactors/orders/OrderNotShippableError";
import { PaymentPreferenceCreationError } from "../../../core/interactors/orders/PaymentPreferenceCreationError";
import { ProductNotFoundError } from "../../../core/interactors/orders/ProductNotFoundError";
import { ShippingLabelNotReadyError } from "../../../core/interactors/orders/ShippingLabelNotReadyError";
import { ShippingQuoteUnavailableError } from "../../../core/interactors/orders/ShippingQuoteUnavailableError";
import { WarehouseNotFoundError } from "../../../core/interactors/warehouses/WarehouseNotFoundError";
import { ZipnovaLabel } from "../../../core/entities/zipnova/ZipnovaShipment";
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
    private readonly generateShippingLabelInteractor: GenerateShippingLabelInteractor,
    private readonly downloadShippingLabelInteractor: DownloadShippingLabelInteractor,
    private readonly resyncOrderInteractor: ResyncOrderInteractor,
    private readonly returnOrderInteractor: ReturnOrderInteractor,
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

  async generateShippingLabel(
    orderId: string,
    warehouseId: string,
  ): Promise<Order> {
    try {
      return await this.generateShippingLabelInteractor.execute(
        orderId,
        warehouseId,
      );
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
      if (err instanceof WarehouseNotFoundError) {
        throw new NotFoundException(
          apiError(ApiErrorCode.warehouseNotFound, err.message),
        );
      }
      if (err instanceof InsufficientStockError) {
        throw new ConflictException(
          apiError(ApiErrorCode.insufficientStock, err.message),
        );
      }
      if (err instanceof ShippingQuoteUnavailableError) {
        throw new ConflictException(
          apiError(ApiErrorCode.shippingQuoteUnavailable, err.message),
        );
      }
      if (err instanceof ProductNotFoundError) {
        throw new NotFoundException(
          apiError(ApiErrorCode.productNotFound, err.message),
        );
      }
      throw new BadGatewayException(
        apiError(
          ApiErrorCode.zipnovaRequestFailed,
          err instanceof Error ? err.message : "Zipnova request failed",
        ),
      );
    }
  }

  async downloadShippingLabel(orderId: string): Promise<ZipnovaLabel> {
    try {
      return await this.downloadShippingLabelInteractor.execute(orderId);
    } catch (err) {
      if (err instanceof OrderNotFoundError) {
        throw new NotFoundException(
          apiError(ApiErrorCode.orderNotFound, err.message),
        );
      }
      if (err instanceof ShippingLabelNotReadyError) {
        throw new ConflictException(
          apiError(ApiErrorCode.shippingLabelNotReady, err.message),
        );
      }
      throw new BadGatewayException(
        apiError(
          ApiErrorCode.zipnovaRequestFailed,
          err instanceof Error ? err.message : "Zipnova request failed",
        ),
      );
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

  async returnOrder(orderId: string, note?: string): Promise<Order> {
    try {
      return await this.returnOrderInteractor.execute(orderId, note);
    } catch (err) {
      if (err instanceof OrderNotFoundError) {
        throw new NotFoundException(
          apiError(ApiErrorCode.orderNotFound, err.message),
        );
      }
      if (err instanceof OrderNotReturnableError) {
        throw new ConflictException(
          apiError(ApiErrorCode.orderNotReturnable, err.message),
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
