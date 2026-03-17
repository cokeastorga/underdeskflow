import { Plan, PlanId } from "@/types/billing";

/** fee_venta rate applied to all plans for own-store sales */
export const FEE_VENTA_RATE = 0.08;

export const PLANS: Plan[] = [
    {
        id: "Basic",
        name: "Basic",
        description: "POS Essential for small stores",
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
            { label: "Venta Directa (POS)", included: true },
            { label: `Fee venta: ${(FEE_VENTA_RATE * 100).toFixed(0)}%`, included: true },
            { label: "Multi-sucursal", included: false },
            { label: "Analytics avanzados", included: false },
            { label: "Canales externos", included: false },
        ],
    },
    {
        id: "Pro",
        name: "Pro",
        badge: "Más popular",
        description: "Multi-branch & Multi-store support",
        priceMonthly: 29000,
        maxStores: 5,
        maxProducts: 500,
        maxLocations: 5,
        color: "blue",
        highlight: true,
        fee_venta_rate: FEE_VENTA_RATE,
        channelSyncEnabled: false,
        multiLocationEnabled: true,
        advancedAnalyticsEnabled: true,
        features: [
            { label: "Hasta 5 tiendas propias", included: true },
            { label: "Hasta 500 productos", included: true },
            { label: "Hasta 5 sucursales", included: true },
            { label: "Analytics avanzados", included: true },
            { label: "Soporte prioritario", included: true },
            { label: `Fee venta: ${(FEE_VENTA_RATE * 100).toFixed(0)}%`, included: true },
            { label: "Canales externos", included: false },
            { label: "Sincronización multi-tienda", included: true },
        ],
    },
    {
        id: "Enterprise",
        name: "Enterprise",
        description: "Full sync & Massive management",
        priceMonthly: 99000,
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
            { label: "Tiendas ilimitadas", included: true },
            { label: "Productos ilimitados", included: true },
            { label: "Sucursales ilimitadas", included: true },
            { label: "Canales externos (Shopify, ML, etc.)", included: true },
            { label: "Sync bidireccional masivo", included: true },
            { label: "Soporte dedicado 24/7", included: true },
            { label: `Fee venta reducida: 5%`, included: true },
            { label: "Sincronización total", included: true },
        ],
    },
];

/** Get a single plan definition by its id (defaults to Basic if not found) */
export function getPlanById(id: PlanId | undefined): Plan {
    return PLANS.find(p => p.id === id) ?? PLANS[0];
}

export const PLAN_FEATURES: Record<string, PlanId[]> = {
    ENTERPRISE_CHANNEL_SYNC: ["Enterprise"],
    MULTI_LOCATION: ["Pro", "Enterprise"],
    ADVANCED_ANALYTICS: ["Pro", "Enterprise"],
    MULTI_USER: ["Enterprise"],
    WHITE_LABEL: ["Enterprise"],
};

/**
 * Returns true if the user can create another store given their current store count and plan.
 */
export function canCreateStore(currentStoreCount: number, plan: PlanId | undefined | null): boolean {
    const p = getPlanById(plan ?? "Basic");
    if (p.maxStores === -1) return true;
    return currentStoreCount < p.maxStores;
}

/**
 * Formatted limit message shown in the upgrade prompt or billing page.
 */
export function planLimitMessage(plan: PlanId | undefined | null): string {
    const p = getPlanById(plan ?? "Basic");
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
