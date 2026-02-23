import { Product, Category } from "@/types";
import { ChannelConnection } from "@/types/channels";

/**
 * PricingResolver — Cascading pricing logic for Multi-channel E-commerce.
 * 
 * Hierarchy (Cascading logic):
 * 1. Product Override: Fixed price per channel on the product itself.
 * 2. Category Markup: Percentage added based on product's category configuration for the channel.
 * 3. Channel Global Markup: Default percentage defined in the channel connection.
 * 
 * Formula for Markups: FinalPrice = BasePrice * (1 + markupPercent / 100)
 */
export class PricingResolver {

    /**
     * Resolves the final price for a product on a specific channel connection.
     */
    static resolvePrice(
        product: Product,
        category: Category | null,
        connection: ChannelConnection
    ): number {
        const basePrice = product.price;
        const channelId = connection.id;
        const channelType = connection.channelType;

        // 1. Level: Product Override (High Specificity)
        // Check by connection ID first, then fallback to channel type
        const override = product.channelOverrides?.[channelId] || product.channelOverrides?.[channelType];
        if (override?.price !== undefined) {
            return override.price;
        }

        // 2. Level: Category Markup (Medium Specificity)
        if (category && category.channelMarkups) {
            const catMarkup = category.channelMarkups[channelId] || category.channelMarkups[channelType];
            if (catMarkup !== undefined) {
                return this.applyMarkup(basePrice, catMarkup);
            }
        }

        // 3. Level: Channel Global Markup (Low Specificity)
        const globalMarkup = connection.syncConfig.priceMarkupPercent;
        if (globalMarkup !== undefined) {
            return this.applyMarkup(basePrice, globalMarkup);
        }

        // Default: Return base price if no rules found
        return basePrice;
    }

    private static applyMarkup(base: number, percent: number): number {
        if (percent === 0) return base;
        // Calculation: Price * (1 + Markup/100)
        // Rounded to 0 decimals (assuming standard currency units/cents are handled upstream if needed)
        return Math.round(base * (1 + (percent / 100)));
    }
}
