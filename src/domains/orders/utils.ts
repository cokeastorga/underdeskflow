export interface SimplifiedOrderItem {
    price: number;
    quantity: number;
}

export interface OrderTotals {
    subtotal: number;
    discountAmount: number;
    platformFee: number;
    total: number;
}

/**
 * Calculates Subtotal, Platform Fee, and Final Total logically.
 * Represents the UnderDeskFlow SaaS model where online channels take an 8% commission.
 */
export function calculateOrderTotals(
    items: SimplifiedOrderItem[], 
    discount: number = 0,
    feePercentage: number = 0 // e.g. 0.08 for 8% UnderDeskFlow fee on online channels
): OrderTotals {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalAfterDiscount = Math.max(0, subtotal - discount);
    
    // Fee is usually calculated on the total after discounts, depending on business rules.
    const platformFee = Math.round(totalAfterDiscount * feePercentage);
    
    return {
        subtotal,
        discountAmount: discount,
        platformFee,
        total: totalAfterDiscount
    };
}
