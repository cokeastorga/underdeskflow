export type PriceRuleScope = "GLOBAL" | "CHANNEL" | "BRANCH";

export interface PriceRule {
    id: string; // e.g. pr_123
    storeId: string;
    variantId: string;
    
    scope: PriceRuleScope;
    scopeId?: string; // e.g. "MERCADOLIBRE" or "branch_centro"
    
    // Type of rule calculation
    type: "FIXED" | "PERCENTAGE_DISCOUNT" | "PERCENTAGE_MARKUP";
    value: number; // e.g. 1500 (fixed) or 10 (percentage)
    
    isActive: boolean;
    validFrom?: number;
    validTo?: number; // Optional Expiration date (promotions)
    
    createdAt: number;
    updatedAt: number;
}
