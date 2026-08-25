export interface ZipnovaDestination {
  name: string;
  street: string;
  streetNumber: string;
  document: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  zipcode: string;
}

export interface QuoteShipmentInput {
  originId: number;
  declaredValue: number;
  cardUnits: number;
  destination: {
    city: string;
    state: string;
    zipcode: string;
  };
}

export interface ZipnovaQuoteAlternative {
  carrierId: number;
  carrierName: string;
  serviceType: string;
  logisticType: string;
  /** price_incl_tax — what Rituo actually pays. */
  price: number;
  estimatedDelivery: string | null;
}

export interface CreateZipnovaShipmentInput {
  originId: number;
  carrierId: number;
  serviceType: string;
  logisticType: string;
  declaredValue: number;
  externalId: string;
  cardUnits: number;
  destination: ZipnovaDestination;
}

export interface CreatedZipnovaShipment {
  id: number;
  trackingNumber: string | null;
  price: number;
}

export interface ZipnovaLabel {
  buffer: Buffer;
  contentType: string;
}

export interface CreateOriginAddressInput {
  name: string;
  street: string;
  streetNumber: string;
  city: string;
  state: string;
  zipcode: string;
  phone: string;
  email: string;
}

export interface CreatedZipnovaOriginAddress {
  id: number;
}
