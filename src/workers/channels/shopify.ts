import { getMappingsForVariant } from "@/domains/channels/services.server";

// Pretend this is initialized with Shopify Admin API credentials
// import '@shopify/shopify-api/adapters/node';
// import { shopifyApi } from '@shopify/shopify-api';

/**
 * Worker Logic: Push Inventory updates to Shopify.
 * Triggered by Event Bus: `inventory.movement_created` OR `order.paid`
 */
export async function pushInventoryToShopify(storeId: string, variantId: string, newStockLevel: number) {
    // 1. Check if this internal variant is actually mapped to Shopify
    const mappings = await getMappingsForVariant(variantId);
    
    // 2. Find Shopify specific mapping
    const shopifyMap = mappings.find(m => m.channel === "SHOPIFY" && m.syncInventory);
    
    if (!shopifyMap) {
        // Not sold on Shopify, or sync is disabled
        return;
    }
    
    const shopifyInventoryItemId = shopifyMap.externalId; // Usually different than standard variantId in Shopify, but depends on setup
    
    console.log(`[Worker:Shopify] Pushing new stock (${newStockLevel}) for Variant ${variantId} -> Shopify Item ${shopifyInventoryItemId}`);
    
    // 3. Connect to Shopify API
    // 3. Connect to Shopify API
    // const client = new shopify.clients.Graphql({ session });
    // const res = await client.query({
    //     data: `
    //         mutation inventoryAdjustQuantity($input: InventoryAdjustQuantityInput!) {
    //             inventoryAdjustQuantity(input: $input) {
    //                 inventoryLevel {
    //                     quantities { name quantity }
    //                 }
    //             }
    //         }
    //     `,
    //     variables: {
    //         input: {
    //             inventoryLevelId: shopifyInventoryItemId,
    //             availableDelta: 1 /* logic to diff */
    //         }
    //     }
    // });
    
    return true;
}
