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

export interface StorePaymentConfig {
    mercadopago?: {
        access_token: string;
        public_key: string; 
        refresh_token?: string;
        mp_user_id?: string;
    };
    stripe?: {
        accountId: string;
    };
    // Future platforms e.g. flow
}

export interface TenantStore {
    id: string; // store_123
    accountId: string;
    name: string;
    slug: string; // Used for *.udf.cl
    plan: "starter" | "growth" | "pro";
    isActive: boolean;
    
    // Payment Configuration for Bricks/Marketplace
    payment_config?: StorePaymentConfig;
    
    // SaaS Activation Metrics
    activationStatus: ActivationStatus;
    activationSteps: ActivationSteps;
    activatedAt?: number;
    firstSaleAt?: number; // Crucial for measuring Time-to-First-Sale

    createdAt: number;
}
