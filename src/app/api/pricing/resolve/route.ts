import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin-config";
import { calculateEffectivePrice } from "@/domains/pricing/engine";
import { PriceRule } from "@/domains/pricing/types";

/**
 * GET /api/pricing/resolve?storeId=&variantId=&branchId=&channel=
 *
 * Resolves the effective selling price for a variant at a given branch or channel,
 * applying all active price rules (BRANCH > CHANNEL > GLOBAL > base price).
 *
 * Returns the resolved price + which rule was applied (for transparency in the POS).
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const storeId   = searchParams.get("storeId");
        const variantId = searchParams.get("variantId");
        const branchId  = searchParams.get("branchId") ?? undefined;
        const channel   = searchParams.get("channel") ?? undefined;

        if (!storeId || !variantId) {
            return NextResponse.json({ error: "storeId and variantId required" }, { status: 400 });
        }

        // Fetch variant base price
        const variantSnap = await adminDb.collection("variants").doc(variantId).get();
        if (!variantSnap.exists) {
            return NextResponse.json({ error: "Variant not found" }, { status: 404 });
        }
        const basePrice: number = variantSnap.data()?.basePrice ?? 0;

        // Fetch active price rules for this storeId + variantId
        const rulesSnap = await adminDb
            .collection("price_rules")
            .where("storeId", "==", storeId)
            .where("variantId", "==", variantId)
            .where("isActive", "==", true)
            .get();

        const rules = rulesSnap.docs.map(d => d.data() as PriceRule);

        // Filter by validity window (validFrom / validTo)
        const now = Date.now();
        const activeRules = rules.filter(r =>
            (!r.validFrom || r.validFrom <= now) &&
            (!r.validTo || r.validTo >= now)
        );

        const effectivePrice = calculateEffectivePrice(basePrice, activeRules, channel, branchId);

        return NextResponse.json({
            variantId,
            branchId: branchId ?? null,
            channel: channel ?? null,
            basePrice,
            effectivePrice,
            appliedRulesCount: activeRules.length,
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
