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
    latestPayments: any[];
    storesMissingMp: any[];
}

/**
 * UDF Central SuperAdmin aggregation. 
 * Extracts total Gross Merchandising Value (GMV) and UDF collected platform fees across all tenants.
 * Optimized with .limit() to prevent runaway reads in Firebase.
 */
export async function getSuperAdminAnalytics(): Promise<SuperAdminFinancials> {
    // 1. Fetch the latest 500 PAID payment intents to calculate recent GMV / Fees safely without unbounded cost
    const recentPaymentsSnap = await adminDb.collection("payment_intents")
        .where("status", "==", "PAID")
        .orderBy("created_at", "desc")
        .limit(500)
        .get();

    let globalGmv = 0;
    let globalPlatformFees = 0;
    const uniqueStores = new Set<string>();
    const latestPayments: any[] = [];
    
    recentPaymentsSnap.docs.forEach((doc: any, index: number) => {
        const data = doc.data();
        globalGmv += data.amount || 0;
        
        // Use explicitly stored platform fee if available, fallback to 8% calculation
        const fee = data.platform_fee_amount ?? Math.round((data.amount || 0) * 0.08);
        globalPlatformFees += fee;
        
        if (data.store_id) {
            uniqueStores.add(data.store_id);
        }
        
        // Keep the top 20 for the dashboard list
        if (index < 20) {
             latestPayments.push({
                 id: data.id || doc.id,
                 storeId: data.store_id || "unknown",
                 amount: data.amount || 0,
                 platformFee: fee,
                 status: data.status,
                 createdAt: data.created_at || Date.now(),
                 provider: data.provider || "mercadopago"
             });
        }
    });

    // 2. Identify stores missing Mercado Pago OAuth to alert the SuperAdmin
    const storesSnap = await adminDb.collection("stores").limit(100).get();
    const storesMissingMp: any[] = [];
    
    // Iterate serially to avoid hammering the DB with subcollection reads
    for (const docSnap of storesSnap.docs) {
         const storeId = docSnap.id;
         const storeData = docSnap.data();
         
         // Skip system/superadmin accounts implicitly if they have specific names or lack tenant traits
         if (storeData.name?.toLowerCase().includes("superadmin")) continue;
         
         const mpDoc = await adminDb.collection("stores").doc(storeId).collection("integrations").doc("mercadopago").get();
         const mpData = mpDoc.data();
         
         if (!mpDoc.exists || !mpData?.enabled || !mpData?.accessToken) {
             storesMissingMp.push({
                 id: storeId,
                 name: storeData.name || storeId
             });
         }
    }

    return {
        globalGmv,
        globalPlatformFees,
        totalOrders: recentPaymentsSnap.size,
        activeStores: uniqueStores.size,
        latestPayments,
        storesMissingMp
    };
}
