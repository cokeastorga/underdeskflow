export type ChannelType = "SHOPIFY" | "MERCADOLIBRE" | "RAPPI" | "UBEREATS" | "WOOCOMMERCE";

export interface ChannelProduct {
    id: string; // Composite: variantId_channelType
    storeId: string;
    
    // Internal Reference
    productId: string;
    variantId: string;
    
    // External Reference
    channel: ChannelType;
    externalId: string; // e.g. MLA123456 or Shopify Variant ID
    externalProductId?: string; // Optional: Shopify Item ID vs Shopify Variant ID
    
    // Config
    syncInventory: boolean;
    syncPrice: boolean;
    
    createdAt: number;
    updatedAt: number;
}
