import { adminDb } from "@/lib/firebase/admin-config";
import { PriceRule, PriceRuleScope } from "./types";
import { Variant } from "@/domains/catalog/types";
import { calculateEffectivePrice } from "./engine";

const rulesCol = adminDb.collection("price_rules");

/**
 * Creates a pricing override / rule.
 */
export async function createPriceRule(
    storeId: string, 
    variantId: string, 
    scope: PriceRuleScope, 
    type: Pick<PriceRule, "type">["type"],
    value: number,
    scopeId?: string,
    validFrom?: number,
    validTo?: number
) {
    const docRef = rulesCol.doc();
    const id = `pr_${docRef.id}`;
    
    const rule: PriceRule = {
        id,
        storeId,
        variantId,
        scope,
        scopeId,
        type,
        value,
        isActive: true,
        validFrom,
        validTo,
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    
    await docRef.set(rule);
    return rule;
}

/**
 * Calculates the Effective Price for a Variant inside a specific Sale Context (Channel or Branch).
 * Automatically fetches active rules from Firestore.
 */
export async function resolveEffectivePrice(
    storeId: string, 
    variant: Variant, 
    channel?: string, 
    branchId?: string
): Promise<number> {
    const basePrice = variant.basePrice;
    const now = Date.now();
    
    const snap = await rulesCol
        .where("storeId", "==", storeId)
        .where("variantId", "==", variant.id)
        .where("isActive", "==", true)
        .get();
        
    const rules = snap.docs
        .map(d => d.data() as PriceRule)
        .filter(r => (!r.validFrom || now >= r.validFrom) && (!r.validTo || now <= r.validTo));

    return calculateEffectivePrice(basePrice, rules, channel, branchId);
}
