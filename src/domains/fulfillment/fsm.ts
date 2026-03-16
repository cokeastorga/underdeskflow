// src/domains/fulfillment/fsm.ts
import { FulfillmentStatus } from './types';

// Definimos el grafo estricto de transiciones logísticas permitidas
const ALLOWED_TRANSITIONS: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  PENDING: ['PREPARING', 'CANCELED'],
  PREPARING: ['READY', 'CANCELED'],
  READY: ['OUT_FOR_DELIVERY', 'SHIPPED', 'DELIVERED' /* Si es PICKUP pasa directo a DELIVERED */, 'CANCELED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED'],
  SHIPPED: ['DELIVERED', 'FAILED'],
  DELIVERED: [], // Estado final
  CANCELED: [],  // Estado final
  FAILED: ['PENDING', 'CANCELED'], // Puede volver a PENDING para reintento
};

export class FulfillmentFSM {
  /**
   * Verifica si la transición de un estado a otro es válida.
   */
  static canTransition(current: FulfillmentStatus, next: FulfillmentStatus): boolean {
    if (current === next) return true; // Permite auto-transiciones (idempotencia)
    const allowed = ALLOWED_TRANSITIONS[current] || [];
    return allowed.includes(next);
  }

  /**
   * Ejecuta la transición o lanza un error si es inválida.
   */
  static transition(current: FulfillmentStatus, next: FulfillmentStatus): FulfillmentStatus {
    if (!this.canTransition(current, next)) {
      throw new Error(`Invalid fulfillment state transition from ${current} to ${next}`);
    }
    return next;
  }
}
