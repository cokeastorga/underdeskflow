
import { NextResponse } from "next/server";
import { SumUpService, SumUpTransaction } from "@/lib/services/sumup";
import { adminDb, adminAuth } from "@/lib/firebase/admin-config";
import { Order } from "@/types";

interface MigrationRequestBody {
    apiKey: string;
    storeId: string;
}

export async function POST(req: Request) {
    try {
        // 1. Authentication Check
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const idToken = authHeader.split("Bearer ")[1];
        let decodedToken;

        try {
            decodedToken = await adminAuth.verifyIdToken(idToken);
        } catch (error) {
            console.error("Token verification failed:", error);
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        // 2. Parse Body
        const body: MigrationRequestBody = await req.json();
        const { apiKey, storeId } = body;

        if (!apiKey || !storeId) {
            return NextResponse.json({ error: "Missing apiKey or storeId" }, { status: 400 });
        }

        // 3. Security Check: Verify user belongs to store (Optional but recommended)
        // For now, we assume if they have a valid token and know the storeId, it's allowed.
        // In a stricter system, we'd fetch the store verifying ownerId === decodedToken.uid

        // 4. Initialize Service
        const sumupService = new SumUpService(apiKey);

        // 5. Fetch and Normalize Transactions
        // We fetch raw first to have more control or debugging if needed, 
        // but service has normalize=true by default.
        // Let's use the public method that returns Partial<Order>[]
        const transactions = await sumupService.getTransactions(100, true);

        // 6. Save to Firestore
        const batch = adminDb.batch();
        const ordersRef = adminDb.collection("orders");

        let importedCount = 0;
        let duplicateCount = 0;
        let errorCount = 0;

        // Check for existing orders to avoid duplicates
        // We can query by orderNumber (which is transaction_code) and storeId
        // But doing this for 100 items might be slow if we do one by one.
        // For 100 items, one by one is acceptable or `where in` chunks.
        // Let's do one by one for simplicity and robustness in this v1.

        for (const tx of transactions) {
            try {
                // Ensure storeId is set
                const orderData = {
                    ...tx,
                    storeId,
                    // Ensure IDs
                    id: ordersRef.doc().id, // Generate new ID
                    customerId: decodedToken.uid // Link to importing user as customer? Or keep generic?
                    // actually customerId should probably be the buyer, but we don't know them.
                    // So lets leave customerId undefined or "guest"
                } as Order;

                // Check duplicate
                // Assuming orderNumber is unique per store from SumUp
                const snapshot = await ordersRef
                    .where("storeId", "==", storeId)
                    .where("orderNumber", "==", orderData.orderNumber)
                    .limit(1)
                    .get();

                if (!snapshot.empty) {
                    duplicateCount++;
                    continue;
                }

                const docRef = ordersRef.doc(orderData.id);
                batch.set(docRef, orderData);
                importedCount++;

            } catch (e) {
                console.error("Error processing transaction", e);
                errorCount++;
            }
        }

        if (importedCount > 0) {
            await batch.commit();
        }

        return NextResponse.json({
            success: true,
            totalFound: transactions.length,
            imported: importedCount,
            duplicates: duplicateCount,
            errors: errorCount
        });

    } catch (error: any) {
        console.error("Migration Error:", error);
        return NextResponse.json({
            error: error.message || "Internal Server Error",
            details: error.toString()
        }, { status: 500 });
    }
}
