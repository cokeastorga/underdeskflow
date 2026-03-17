export type PlanId = "Basic" | "Pro" | "Enterprise";

export interface PlanDefinition {
    id: PlanId;
    name: string;
    description: string;
    monthlyPrice: number;
    features: {
        pos: boolean;
        ecommerce: boolean;
        inventory: boolean;
        branchesLimit: number;
        multiStore: boolean;
        platformFee: number; // e.g. 0.08 for 8%
    };
}

export const PLANS: Record<PlanId, PlanDefinition> = {
    Basic: {
        id: "Basic",
        name: "Basic",
        description: "POS Essential for small stores",
        monthlyPrice: 0,
        features: {
            pos: true,
            ecommerce: true, // Split MP mentioned for Basic
            inventory: true,
            branchesLimit: 1,
            multiStore: false,
            platformFee: 0,
        },
    },
    Pro: {
        id: "Pro",
        name: "Pro",
        description: "Multi-branch & Multi-store support",
        monthlyPrice: 29000, 
        features: {
            pos: true,
            ecommerce: true,
            inventory: true,
            branchesLimit: 5,
            multiStore: true,
            platformFee: 0.08,
        },
    },
    Enterprise: {
        id: "Enterprise",
        name: "Enterprise",
        description: "Full sync & Massive management",
        monthlyPrice: 99000,
        features: {
            pos: true,
            ecommerce: true,
            inventory: true,
            branchesLimit: 99,
            multiStore: true,
            platformFee: 0.05,
        },
    },
};

export type SubscriptionStatus = "active" | "pending" | "past_due";

export interface Subscription {
    id: string; // tenantId
    planId: PlanId;
    status: SubscriptionStatus;
    currentPeriodEnd: number;
    cancelAtPeriodEnd: boolean;
    updatedAt: number;
}
