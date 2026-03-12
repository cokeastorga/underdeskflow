export type ActivationStatus = "PENDING" | "ACTIVE";

export interface ActivationSteps {
    logoUploaded: boolean;
    firstProductCreated: boolean;
    paymentsConnected: boolean;
    testOrderCompleted: boolean;
}

export interface TenantAccount {
    id: string; // acc_123
    email: string;
    plan: "starter" | "growth" | "pro";
    createdAt: number;
}

export interface TenantStore {
    id: string; // store_123
    accountId: string;
    name: string;
    slug: string; // Used for *.udf.cl
    plan: "starter" | "growth" | "pro";
    isActive: boolean;
    
    // SaaS Activation Metrics
    activationStatus: ActivationStatus;
    activationSteps: ActivationSteps;
    activatedAt?: number;
    firstSaleAt?: number; // Crucial for measuring Time-to-First-Sale

    createdAt: number;
}
