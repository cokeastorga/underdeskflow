export interface Branch {
    id: string;
    storeId: string;
    name: string;
    address?: string;
    phoneNumber?: string;
    isActive: boolean;
    createdAt: number;
    updatedAt: number;
}

export interface Register {
    id: string;
    storeId: string;
    branchId: string; // The branch this register belongs to
    name: string; // e.g., "Main Register", "Backup Register"
    isActive: boolean;
    createdAt: number;
    updatedAt: number;
}
