import { adminDb } from "@/lib/firebase/admin-config";
import { Order } from "@/domains/orders/types";

export interface DashboardFinancials {
    grossSales: number;
    platformFees: number;
    netSales: number;
    orderCount: number;
}

export async function getFinancialAnalytics(storeId: string): Promise<DashboardFinancials> {

    // Query all orders for the store that are in a 'PAID' status.
    // In a high-volume production scenario, we'd use Firestore Aggregation Queries (count(), sum()) 
    // or a background trigger constantly updating a `sales_daily` document.
    const ordersSnapshot = await adminDb.collection("orders")
        .where("storeId", "==", storeId)
        .where("status", "==", "paid") // Or 'PAID' depending on how it's stored
        .get();

    let grossSales = 0;
    let platformFees = 0;
    
    ordersSnapshot.forEach((doc: any) => {
        const orderData = doc.data() as Partial<Order>;
        
        // Sum the gross amount based on the correct 'total' attribute
        const orderTotal = orderData.total || 0;
        grossSales += orderTotal;
        
        // Compute the 8% fee dynamically if not explicitly stored in older ledgers
        platformFees += Math.round(orderTotal * 0.08);
    });

    return {
        grossSales,
        platformFees,
        netSales: grossSales - platformFees,
        orderCount: ordersSnapshot.size,
    };
}

export interface SuperAdminFinancials {
    globalGmv: number;
    globalPlatformFees: number;
    totalOrders: number;
    activeStores: number;
}

/**
 * UDF Central SuperAdmin aggregation. 
 * Extracts total Gross Merchandising Value (GMV) and UDF collected platform fees across all tenants.
 */
export async function getSuperAdminAnalytics(): Promise<SuperAdminFinancials> {
    // In a high-volume production scenario, we'd use Firestore Aggregation Queries (count(), sum()) 
    // or a background trigger constantly updating a `platform_sales_daily` document.
    const ordersSnapshot = await adminDb.collection("orders")
        .where("status", "==", "paid")
        .get();

    let globalGmv = 0;
    let globalPlatformFees = 0;
    const uniqueStores = new Set<string>();
    
    ordersSnapshot.forEach((doc: any) => {
        const orderData = doc.data() as Partial<Order>;
        const orderTotal = orderData.total || 0;
        
        globalGmv += orderTotal;
        globalPlatformFees += Math.round(orderTotal * 0.08); // Fixed UDF 8% cut
        
        if (orderData.storeId) {
            uniqueStores.add(orderData.storeId);
        }
    });

    return {
        globalGmv,
        globalPlatformFees,
        totalOrders: ordersSnapshot.size,
        activeStores: uniqueStores.size,
    };
}
