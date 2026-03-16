import { getStockByStore } from "@/domains/inventory/services.server";
import { InventoryBalance } from "@/domains/inventory/types";

export interface RoutingCandidate {
    branchId: string;
    availableStock: number;
}

/**
 * Selects the best fulfillable branch for a list of order items.
 *
 * Strategy: "Highest Available" — picks the branch with the most stock
 * for the primary item so the order can be dispatched with minimum
 * inter-branch transfers.
 *
 * In future phases this can be extended to proximity-based routing
 * by passing the customer lat/lng and scoring branches by distance.
 *
 * @param storeId - the tenant's store
 * @param items   - array of { variantId, quantity } from the order
 * @param preferredBranchId - optional hint (e.g. from the POS session)
 * @returns branchId of the best matching branch, or null if no branch
 *          can fulfill all items
 */
export async function selectBranchForFulfillment(
    storeId: string,
    items: Array<{ variantId: string; quantity: number }>,
    preferredBranchId?: string
): Promise<string | null> {
    // Build a map of { branchId -> { variantId -> stock } }
    const branchStock: Record<string, Record<string, number>> = {};

    await Promise.all(items.map(async ({ variantId }) => {
        const balances: InventoryBalance[] = await getStockByStore(storeId, variantId);
        for (const b of balances) {
            if (!branchStock[b.locationId]) branchStock[b.locationId] = {};
            branchStock[b.locationId][variantId] = b.stock;
        }
    }));

    // Score all candidates: must have enough stock for ALL items
    const candidates: RoutingCandidate[] = [];
    for (const [branchId, stockMap] of Object.entries(branchStock)) {
        const canFulfillAll = items.every(({ variantId, quantity }) =>
            (stockMap[variantId] ?? 0) >= quantity
        );
        if (canFulfillAll) {
            // Score = sum of available stock across all items (prefer richest branch)
            const totalStock = items.reduce((acc, { variantId }) =>
                acc + (stockMap[variantId] ?? 0), 0
            );
            candidates.push({ branchId, availableStock: totalStock });
        }
    }

    if (candidates.length === 0) return null;

    // If the preferred branch can also fulfill, use it first
    if (preferredBranchId && candidates.find(c => c.branchId === preferredBranchId)) {
        return preferredBranchId;
    }

    // Otherwise, pick the branch with the most total available stock
    candidates.sort((a, b) => b.availableStock - a.availableStock);
    return candidates[0].branchId;
}
