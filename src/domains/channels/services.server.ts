import { adminDb } from "@/lib/firebase/admin-config";
import { ChannelProduct, ChannelType } from "./types";

const channelProductsCol = adminDb.collection("channel_products");

export async function mapVariantToChannel(
    storeId: string,
    productId: string,
    variantId: string,
    channel: ChannelType,
    externalId: string,
    externalProductId?: string,
    syncInventory: boolean = true,
    syncPrice: boolean = false
) {
    const id = `${variantId}_${channel}`;
    const docRef = channelProductsCol.doc(id);
    
    const mapping: ChannelProduct = {
        id,
        storeId,
        productId,
        variantId,
        channel,
        externalId,
        externalProductId,
        syncInventory,
        syncPrice,
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    
    await docRef.set(mapping);
    return mapping;
}

/** Lookup internal variant -> external ID */
export async function getMappingsForVariant(variantId: string) {
    const snap = await channelProductsCol.where("variantId", "==", variantId).get();
    return snap.docs.map(doc => doc.data() as ChannelProduct);
}

/** Lookup external ID -> internal variant (Crucial for incoming webhooks from ML/Shopify) */
export async function getVariantByExternalId(channel: ChannelType, externalId: string) {
    const snap = await channelProductsCol
        .where("channel", "==", channel)
        .where("externalId", "==", externalId)
        .limit(1)
        .get();
        
    if (snap.empty) return null;
    return snap.docs[0].data() as ChannelProduct;
}
