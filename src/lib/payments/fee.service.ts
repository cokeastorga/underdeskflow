/**
 * Fee Service — Platform commission calculation.
 *
 * Rules (v3.0):
 *  - OWN_STORE sales:      fee_venta = 8% flat, no minimum, no maximum cap
 *  - EXTERNAL_CHANNEL sales: fee = 0  (merchant pays channel's own commission)
 *
 * This is the SINGLE source of truth for platform fee calculation.
 * The previous store.platformCommissionRate / min / max config is deprecated.
 */

export type OrderSource = "OWN_STORE" | "EXTERNAL_CHANNEL";

export const FEE_VENTA_RATE = 0.08; // 8% flat on own-store sales

/**
 * Calculate the platform fee for a given sale.
 *
 * @param grossAmount - Full sale amount in the store's currency (integer cents/CLP)
 * @param orderSource - Whether the order originated from the merchant's own store or an external channel
 * @returns Platform fee amount (always >= 0, integer rounded)
 */
export function calculatePlatformFee(
    grossAmount: number,
    orderSource: OrderSource
): number {
    if (orderSource === "EXTERNAL_CHANNEL") {
        return 0;
    }
    // OWN_STORE: 8% flat, no cap, no floor
    return Math.round(grossAmount * FEE_VENTA_RATE);
}

/**
 * Returns the net amount the merchant receives after platform fee.
 */
export function calculateMerchantNet(
    grossAmount: number,
    orderSource: OrderSource
): number {
    return grossAmount - calculatePlatformFee(grossAmount, orderSource);
}

/**
 * Human-readable fee description for UI display.
 */
export function feeDescription(orderSource: OrderSource): string {
    if (orderSource === "EXTERNAL_CHANNEL") {
        return "Sin comisión de plataforma (canal externo)";
    }
    return `Comisión plataforma: ${(FEE_VENTA_RATE * 100).toFixed(0)}% s/venta`;
}
