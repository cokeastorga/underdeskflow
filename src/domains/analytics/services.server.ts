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
 * Includes FAILED_PRECONDITION fallback: if the composite index for (status, created_at) isn't ready,
 * we fetch without orderBy and sort in memory so the dashboard never crashes.
 */
export async function getSuperAdminAnalytics(): Promise<SuperAdminFinancials> {
    // 1. Fetch the latest 500 PAID payment intents — with index fallback
    let recentPaymentsSnap: FirebaseFirestore.QuerySnapshot;

    try {
        // Requires composite index: payment_intents [status ASC, created_at DESC]
        recentPaymentsSnap = await adminDb.collection("payment_intents")
            .where("status", "==", "PAID")
            .orderBy("created_at", "desc")
            .limit(500)
            .get();
    } catch (err: any) {
        const isMissingIndex =
            err?.code === 9 || // gRPC FAILED_PRECONDITION
            err?.message?.includes("FAILED_PRECONDITION") ||
            err?.message?.includes("index");

        if (isMissingIndex) {
            console.warn("[SuperAdmin] Composite index not ready — falling back to in-memory sort. Create index: payment_intents[status ASC, created_at DESC].");
            // Fetch without orderBy, then sort client-side
            const fallbackSnap = await adminDb.collection("payment_intents")
                .where("status", "==", "PAID")
                .limit(500)
                .get();
            
            // Sort in-memory by created_at descending
            const sortedDocs = [...fallbackSnap.docs].sort((a, b) => {
                const aTs = a.data().created_at ?? 0;
                const bTs = b.data().created_at ?? 0;
                return (typeof bTs === "number" ? bTs : bTs?.toMillis?.() ?? 0) -
                       (typeof aTs === "number" ? aTs : aTs?.toMillis?.() ?? 0);
            });
            
            // Build a minimal QuerySnapshot-compatible object for the rest of the function
            recentPaymentsSnap = { ...fallbackSnap, docs: sortedDocs, size: sortedDocs.length } as any;
        } else {
            // Unknown error — surface it so we don't silently swallow real bugs
            throw err;
        }
    }


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
export interface DailyMetric {
    date: string; // ISO yyyy-mm-dd
    gmv: number;
    fees: number;
}

/**
 * Returns daily GMV and Platform Fees for the last 30 days.
 * Used for the Enterprise HQ Dashboard trends.
 */
export async function getSuperAdminTimeSeries(): Promise<DailyMetric[]> {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    // Fetch PAID intents from last 30 days - with index fallback
    let snapshot: FirebaseFirestore.QuerySnapshot;
    try {
        snapshot = await adminDb.collection("payment_intents")
            .where("status", "==", "PAID")
            .where("created_at", ">=", thirtyDaysAgo)
            .orderBy("created_at", "asc")
            .get();
    } catch (err: any) {
        const isMissingIndex =
            err?.code === 9 || 
            err?.message?.includes("FAILED_PRECONDITION") ||
            err?.message?.includes("index");

        if (isMissingIndex) {
            console.warn("[TimeSeries] Index missing, falling back to in-memory sort.");
            snapshot = await adminDb.collection("payment_intents")
                .where("status", "==", "PAID")
                .where("created_at", ">=", thirtyDaysAgo)
                .get();
            
            // In-memory sort by created_at ascending
            const sortedDocs = [...snapshot.docs].sort((a, b) => {
                const aTs = a.data().created_at ?? 0;
                const bTs = b.data().created_at ?? 0;
                const aVal = typeof aTs === "number" ? aTs : aTs?.toMillis?.() ?? 0;
                const bVal = typeof bTs === "number" ? bTs : bTs?.toMillis?.() ?? 0;
                return aVal - bVal;
            });
            snapshot = { ...snapshot, docs: sortedDocs } as any;
        } else {
            throw err;
        }
    }

    const dailyMap = new Map<string, { gmv: number, fees: number }>();

    // 1. Initialize map with all 30 days to ensure no gaps in the chart
    for (let i = 0; i < 30; i++) {
        const d = new Date(Date.now() - (i * 24 * 60 * 60 * 1000));
        const key = d.toISOString().split('T')[0];
        dailyMap.set(key, { gmv: 0, fees: 0 });
    }

    // 2. Aggregate actual data
    snapshot.docs.forEach(doc => {
        const data = doc.data();
        const ts = data.created_at;
        const dateKey = new Date(ts).toISOString().split('T')[0];
        
        if (dailyMap.has(dateKey)) {
            const vals = dailyMap.get(dateKey)!;
            const amount = data.amount || 0;
            const fee = data.platform_fee_amount ?? Math.round(amount * 0.08);
            
            dailyMap.set(dateKey, {
                gmv: vals.gmv + amount,
                fees: vals.fees + fee
            });
        }
    });

    // 3. Convert to sorted array
    return Array.from(dailyMap.entries())
        .map(([date, vals]) => ({
            date,
            gmv: vals.gmv,
            fees: vals.fees
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
}
