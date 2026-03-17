export type PlanId = "BASIC" | "PRO" | "ENTERPRISE";

export interface PlanDefinition {
    id: PlanId;
    name: string;
    description: string;
    monthlyPrice: number;
    features: {
        pos: boolean;
        ecommerce: boolean;
        inventory: boolean;
        platformFee: number; // e.g. 0.08 for 8%
    };
}

export const PLANS: Record<PlanId, PlanDefinition> = {
    BASIC: {
        id: "BASIC",
        name: "Basic",
        description: "POS Essential for small stores",
        monthlyPrice: 0, // Freemium or low cost
        features: {
            pos: true,
            ecommerce: false,
            inventory: true,
            platformFee: 0,
        },
    },
    PRO: {
        id: "PRO",
        name: "Pro",
        description: "POS + E-commerce + Platform Integration",
        monthlyPrice: 29000, // example in CLP
        features: {
            pos: true,
            ecommerce: true,
            inventory: true,
            platformFee: 0.08,
        },
    },
    ENTERPRISE: {
        id: "ENTERPRISE",
        name: "Enterprise",
        description: "Custom features for large scale operations",
        monthlyPrice: 99000,
        features: {
            pos: true,
            ecommerce: true,
            inventory: true,
            platformFee: 0.05,
        },
    },
};

export type SubscriptionStatus = "ACTIVE" | "PAST_DUE" | "CANCELED" | "TRIALING";

export interface Subscription {
    id: string; // tenantId
    planId: PlanId;
    status: SubscriptionStatus;
    currentPeriodEnd: number;
    cancelAtPeriodEnd: boolean;
    updatedAt: number;
}
