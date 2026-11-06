export interface CreateFullargOrderInput {
  /** Id de nuestra orden: Fullarg lo devuelve en sus webhooks para que la reconozcamos. */
  externalOrderId: string;
  /** Misma clave siempre para la misma orden, así un reintento no duplica el envío. */
  idempotencyKey: string;
  sku: string;
  quantity: number;
  /** Operador logístico / modalidad (`shipping_method`); si falta, decide Fullarg. */
  shippingMethod?: string;
  buyer: {
    name: string;
    email: string;
    phone: string;
  };
  shipping: {
    address: string;
    city: string;
    state: string;
    postalCode: string;
  };
}

export interface CreatedFullargOrder {
  salesOrder: string;
  status: string;
  /** True si Fullarg ya tenía esta orden (reintento con la misma clave). */
  alreadyExisted: boolean;
}
