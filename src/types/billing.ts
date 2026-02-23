export type PlanId = "basic" | "intermedio" | "enterprise";
export type SubscriptionStatus = "active" | "trialing" | "past_due" | "cancelled" | "free";

export interface PlanFeature {
    label: string;
    included: boolean;
}

export interface Plan {
    id: PlanId;
    name: string;
    badge?: string;           // e.g. "Más popular"
    description: string;
    priceMonthly: number;     // CLP; 0 = gratuito
    maxStores: number;
    maxProducts: number;      // -1 = unlimited
    maxLocations: number;
    features: PlanFeature[];
    color: string;            // Tailwind color token
    highlight: boolean;       // show as featured card
    /** Platform fee rate on own-store sales (0.08 = 8%) */
    fee_venta_rate: number;
    /** Whether this plan enables external channel sync (Enterprise only) */
    channelSyncEnabled: boolean;
    /** Whether this plan enables multiple inventory locations */
    multiLocationEnabled: boolean;
    /** Whether this plan enables advanced analytics */
    advancedAnalyticsEnabled: boolean;
}

export interface Subscription {
    id?: string;
    storeId: string;           // owning store
    ownerId: string;           // Firebase uid
    plan: PlanId;
    status: SubscriptionStatus;
    currentPeriodStart?: number;
    currentPeriodEnd?: number;
    cancelAtPeriodEnd?: boolean;
    createdAt: number;
    updatedAt?: number;
}
