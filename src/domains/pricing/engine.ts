import { PriceRule } from "./types";

/**
 * Pure function to calculate Effective Price given a pre-fetched set of rules.
 * Order of Precedence: CHANNEL Rule > BRANCH Rule > GLOBAL Rule > Variant Base Price.
 */
export function calculateEffectivePrice(
    basePrice: number,
    activeRules: PriceRule[],
    channel?: string,
    branchId?: string
): number {
    if (activeRules.length === 0) return basePrice;
    
    // Sort logic to find the highest precedence rule
    // Precedence: 1: Channel Specific, 2: Branch Specific, 3: Global
    
    const channelRule = activeRules.find(r => r.scope === "CHANNEL" && r.scopeId === channel);
    if (channelRule) return applyRule(basePrice, channelRule);
    
    if (branchId) {
        const branchRule = activeRules.find(r => r.scope === "BRANCH" && r.scopeId === branchId);
        if (branchRule) return applyRule(basePrice, branchRule);
    }
    
    const globalRule = activeRules.find(r => r.scope === "GLOBAL");
    if (globalRule) return applyRule(basePrice, globalRule);
    
    return basePrice;
}

// Helper to calculate the math
function applyRule(basePrice: number, rule: PriceRule): number {
    switch (rule.type) {
        case "FIXED":
            return rule.value;
        case "PERCENTAGE_DISCOUNT":
            return Math.max(0, basePrice - (basePrice * (rule.value / 100)));
        case "PERCENTAGE_MARKUP":
            return basePrice + (basePrice * (rule.value / 100));
        default:
            return basePrice;
    }
}
