import { IWarehousesRepository } from "../../adapters/repositories/warehouses/IWarehousesRepository";
import { IZipnovaGateway } from "../../adapters/services/zipnova/IZipnovaGateway";
import { Warehouse } from "../../entities/warehouses/Warehouse";

export interface CreateWarehouseInput {
  name: string;
  addressStreet: string;
  addressStreetNumber: string;
  addressCity: string;
  addressState: string;
  addressZipcode: string;
  addressPhone: string;
  addressEmail: string;
}

const COMBINING_DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Registers a new pickup address directly in Zipnova (so the admin never has
 * to go into Zipnova's own dashboard) and stores it locally as a depósito
 * with its own stock ledger.
 */
export class CreateWarehouseInteractor {
  constructor(
    private readonly warehousesRepository: IWarehousesRepository,
    private readonly zipnovaGateway: IZipnovaGateway,
  ) {}

  async execute(input: CreateWarehouseInput): Promise<Warehouse> {
    const slug = await this.uniqueSlug(slugify(input.name) || "deposito");

    const address = await this.zipnovaGateway.createOriginAddress({
      name: input.name,
      street: input.addressStreet,
      streetNumber: input.addressStreetNumber,
      city: input.addressCity,
      state: input.addressState,
      zipcode: input.addressZipcode,
      phone: input.addressPhone,
      email: input.addressEmail,
    });

    return this.warehousesRepository.create({
      slug,
      name: input.name,
      addressStreet:
        `${input.addressStreet} ${input.addressStreetNumber}`.trim(),
      addressCity: input.addressCity,
      addressState: input.addressState,
      addressZipcode: input.addressZipcode,
      addressPhone: input.addressPhone,
      addressEmail: input.addressEmail,
      zipnovaOriginId: address.id,
    });
  }

  private async uniqueSlug(base: string): Promise<string> {
    let candidate = base;
    let suffix = 2;

    while (await this.warehousesRepository.getBySlug(candidate)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }
}
