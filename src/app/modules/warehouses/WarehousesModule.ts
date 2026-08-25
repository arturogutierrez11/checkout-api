import { Module } from "@nestjs/common";
import {
  IWarehousesRepository,
  WAREHOUSES_REPOSITORY,
} from "../../../core/adapters/repositories/warehouses/IWarehousesRepository";
import {
  IZipnovaGateway,
  ZIPNOVA_GATEWAY,
} from "../../../core/adapters/services/zipnova/IZipnovaGateway";
import { CreateWarehouseInteractor } from "../../../core/interactors/warehouses/CreateWarehouseInteractor";
import { ListWarehousesInteractor } from "../../../core/interactors/warehouses/ListWarehousesInteractor";
import { WarehousesController } from "../../controllers/warehouses/WarehousesController";
import { CheckoutInternalGuard } from "../../services/checkoutInternalAuth/guards/CheckoutInternalGuard";
import { ZipnovaGateway } from "../../services/zipnova/ZipnovaGateway";
import { WarehousesService } from "../../services/warehouses/WarehousesService";

@Module({
  controllers: [WarehousesController],
  providers: [
    {
      provide: ZIPNOVA_GATEWAY,
      useClass: ZipnovaGateway,
    },
    {
      provide: ListWarehousesInteractor,
      useFactory: (warehousesRepository: IWarehousesRepository) =>
        new ListWarehousesInteractor(warehousesRepository),
      inject: [WAREHOUSES_REPOSITORY],
    },
    {
      provide: CreateWarehouseInteractor,
      useFactory: (
        warehousesRepository: IWarehousesRepository,
        zipnovaGateway: IZipnovaGateway,
      ) => new CreateWarehouseInteractor(warehousesRepository, zipnovaGateway),
      inject: [WAREHOUSES_REPOSITORY, ZIPNOVA_GATEWAY],
    },
    CheckoutInternalGuard,
    WarehousesService,
  ],
})
export class WarehousesModule {}
