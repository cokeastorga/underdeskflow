import { Plan, PlanId } from "@/types/billing";

/** fee_venta rate applied to all plans for own-store sales */
export const FEE_VENTA_RATE = 0.08;

export const PLANS: Plan[] = [
    {
        id: "basic",
        name: "Básico",
        description: "Todo lo que necesitas para empezar.",
        priceMonthly: 0,
        maxStores: 1,
        maxProducts: 50,
        maxLocations: 1,
        color: "zinc",
        highlight: false,
        fee_venta_rate: FEE_VENTA_RATE,
        channelSyncEnabled: false,
        multiLocationEnabled: false,
        advancedAnalyticsEnabled: false,
        features: [
            { label: "1 tienda online propia", included: true },
            { label: "Hasta 50 productos", included: true },
            { label: "1 sucursal", included: true },
            { label: "Ledger + payouts automáticos", included: true },
            { label: "Envíos básicos", included: true },
            { label: "Soporte por email (48h)", included: true },
            { label: `Fee venta tienda propia: ${(FEE_VENTA_RATE * 100).toFixed(0)}%`, included: true },
            { label: "Multi-sucursal", included: false },
            { label: "Analytics avanzados", included: false },
            { label: "Canales externos (Shopify, ML…)", included: false },
        ],
    },
    {
        id: "intermedio",
        name: "Intermedio",
        badge: "Más popular",
        description: "Para negocios en crecimiento con varias sucursales.",
        priceMonthly: 29990,
        maxStores: 5,
        maxProducts: 500,
        maxLocations: 10,
        color: "blue",
        highlight: true,
        fee_venta_rate: FEE_VENTA_RATE,
        channelSyncEnabled: false,
        multiLocationEnabled: true,
        advancedAnalyticsEnabled: true,
        features: [
            { label: "Hasta 5 tiendas propias", included: true },
            { label: "Hasta 500 productos", included: true },
            { label: "Hasta 10 sucursales", included: true },
            { label: "Ledger + payouts automáticos", included: true },
            { label: "Envíos con portadores (Blue Express, Starken, etc.)", included: true },
            { label: "Analytics avanzados", included: true },
            { label: "Soporte prioritario (24h)", included: true },
            { label: `Fee venta tienda propia: ${(FEE_VENTA_RATE * 100).toFixed(0)}%`, included: true },
            { label: "Canales externos (Shopify, ML…)", included: false },
            { label: "Múltiples usuarios con RBAC", included: false },
        ],
    },
    {
        id: "enterprise",
        name: "Enterprise",
        description: "Multitienda, multicanal y soporte dedicado.",
        priceMonthly: 99990,
        maxStores: -1,
        maxProducts: -1,
        maxLocations: -1,
        color: "violet",
        highlight: false,
        fee_venta_rate: FEE_VENTA_RATE,
        channelSyncEnabled: true,
        multiLocationEnabled: true,
        advancedAnalyticsEnabled: true,
        features: [
            { label: "Tiendas propias ilimitadas", included: true },
            { label: "Productos y sucursales ilimitados", included: true },
            { label: "Ledger + payouts automáticos", included: true },
            { label: "Todos los portadores de envío", included: true },
            { label: "Analytics avanzados", included: true },
            { label: "Múltiples usuarios con RBAC", included: true },
            { label: "White-label (dominio propio)", included: true },
            { label: "Soporte dedicado 24/7", included: true },
            { label: `Fee venta tienda propia: ${(FEE_VENTA_RATE * 100).toFixed(0)}%`, included: true },
            { label: "✅ Canales externos (Shopify, ML, PedidosYa…)", included: true },
            { label: "✅ Sync bidireccional inventario/precios", included: true },
            { label: "✅ Dashboard consolidado multicanal", included: true },
            { label: "Sin comisión en ventas de canales externos", included: true },
        ],
    },
];

/** Get a single plan definition by its id (defaults to basic if not found) */
export function getPlanById(id: PlanId | undefined): Plan {
    return PLANS.find(p => p.id === id) ?? PLANS[0];
}

/**
 * Map of feature flags to allowed plan ids.
 * Exported here to avoid circular dependency between billing/plans and feature-flags.
 * feature-flags.ts reads this map — not the other way around.
 */
export const PLAN_FEATURES: Record<string, PlanId[]> = {
    ENTERPRISE_CHANNEL_SYNC: ["enterprise"],
    MULTI_LOCATION: ["intermedio", "enterprise"],
    ADVANCED_ANALYTICS: ["intermedio", "enterprise"],
    MULTI_USER: ["enterprise"],
    WHITE_LABEL: ["enterprise"],
};

/**
 * Returns true if the user can create another store given their current store count and plan.
 */
export function canCreateStore(currentStoreCount: number, plan: PlanId | undefined | null): boolean {
    const p = getPlanById(plan ?? "basic");
    if (p.maxStores === -1) return true;
    return currentStoreCount < p.maxStores;
}

/**
 * Formatted limit message shown in the upgrade prompt or billing page.
 */
export function planLimitMessage(plan: PlanId | undefined | null): string {
    const p = getPlanById(plan ?? "basic");
    if (p.maxStores === -1) return `Tu plan ${p.name} permite tiendas ilimitadas.`;
    return `Tu plan ${p.name} permite hasta ${p.maxStores} tienda${p.maxStores > 1 ? "s" : ""}.`;
}

/**
 * Format price in CLP.
 */
export function formatPlanPrice(priceMonthly: number): string {
    if (priceMonthly === 0) return "Gratis";
    return `$${priceMonthly.toLocaleString("es-CL")} / mes`;
}
