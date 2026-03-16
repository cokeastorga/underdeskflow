// src/domains/fulfillment/types.ts

export type FulfillmentStatus = 
  | 'PENDING'            // Recién creado, esperando que alguien lo tome
  | 'PREPARING'          // En cocina o siendo empacado (Picking/Packing)
  | 'READY'              // Listo para retiro o para ser entregado al chofer
  | 'OUT_FOR_DELIVERY'   // En camino al cliente (Repartidor local)
  | 'SHIPPED'            // Entregado a un courier de terceros (ej. Starken)
  | 'DELIVERED'          // Entregado exitosamente al cliente final
  | 'CANCELED'           // Despacho cancelado
  | 'FAILED';            // Intento de entrega fallido

export type FulfillmentType = 
  | 'PICKUP'           // Retiro en tienda
  | 'LOCAL_DELIVERY'   // Despacho propio de la tienda
  | 'THIRD_PARTY';     // Courier externo

export interface FulfillmentItem {
  productId: string;
  variantId?: string;
  sku: string;
  name: string;
  quantity: number;
}

export interface OrderFulfillment {
  id: string;
  orderId: string;
  storeId: string;
  branchId: string;
  status: FulfillmentStatus;
  fulfillmentType: FulfillmentType;
  
  items: FulfillmentItem[];
  
  // Datos del receptor y destino
  customerName?: string;
  customerPhone?: string;
  shippingAddress?: string; // Opcional si es PICKUP
  
  // Seguimiento
  assignedDriverId?: string;
  trackingCode?: string;     // Para couriers de terceros
  trackingUrl?: string;      // Para couriers de terceros
  
  // Timestamps de auditoría
  createdAt: number;
  updatedAt: number;
  preparedAt?: number;
  readyAt?: number;
  shippedAt?: number;
  deliveredAt?: number;
}
