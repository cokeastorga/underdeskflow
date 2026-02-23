/**
 * Adapter Registry — Singleton registry for all ChannelAdapter instances.
 *
 * Returns the correct adapter instance based on ChannelType.
 * All adapters are stateless singletons — credentials are always passed in.
 */

import { ChannelAdapter } from "./adapters/channel-adapter.interface";
import { ChannelType } from "@/types/channels";
import { ShopifyAdapter } from "./adapters/shopify.adapter";
import { WooCommerceAdapter } from "./adapters/woocommerce.adapter";
import { MercadoLibreAdapter } from "./adapters/mercadolibre.adapter";
import { TiendanubeAdapter } from "./adapters/tiendanube.adapter";
import { PedidosYaAdapter } from "./adapters/pedidosya.adapter";

// ─── Registry ──────────────────────────────────────────────────────────────────

const ADAPTERS: Record<ChannelType, ChannelAdapter> = {
    shopify: new ShopifyAdapter(),
    woocommerce: new WooCommerceAdapter(),
    mercadolibre: new MercadoLibreAdapter(),
    tiendanube: new TiendanubeAdapter(),
    pedidosya: new PedidosYaAdapter(),
    falabella: null as any,  // Placeholder — Phase 3
    rappi: null as any,  // Placeholder — Phase 3
};

/**
 * Get the adapter for a given channel type.
 * @throws Error if the adapter is not yet implemented
 */
export function getAdapter(channelType: ChannelType): ChannelAdapter {
    const adapter = ADAPTERS[channelType];
    if (!adapter) {
        throw new Error(`No adapter implemented for channel type: ${channelType}`);
    }
    return adapter;
}

/**
 * Check if an adapter is available for the given channel type.
 */
export function hasAdapter(channelType: ChannelType): boolean {
    return !!ADAPTERS[channelType];
}

/**
 * List all supported (implemented) channel types.
 */
export function getSupportedChannels(): ChannelType[] {
    return (Object.entries(ADAPTERS) as [ChannelType, ChannelAdapter | null][])
        .filter(([, adapter]) => !!adapter)
        .map(([type]) => type);
}
