import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin-config";

import { getSecret, setSecret, deleteSecret } from "@/lib/secrets";
import { SumUpService } from "@/lib/services/sumup";

/**
 * POST /api/pos/sumup/connect
 * Validates SumUp API key, stores it in Secret Manager, saves metadata to Firestore.
 *
 * DELETE /api/pos/sumup/connect
 * Removes the secret and Firestore metadata.
 */

export async function POST(req: NextRequest) {
    try {
        const { apiKey, storeId } = await req.json();

        if (!apiKey || !storeId) {
            return NextResponse.json({ error: "apiKey and storeId required" }, { status: 400 });
        }

        // Validate key against SumUp API
        const service = new SumUpService(apiKey);
        let profile;
        try {
            profile = await service.getMerchantProfile();
        } catch (err: any) {
            return NextResponse.json(
                { error: `Invalid SumUp API Key: ${err.message}` },
                { status: 422 }
            );
        }

        // Store key in Secret Manager (adds a new version = key rotation support)
        const secretName = `sumup_${storeId}_apikey`;
        await setSecret(secretName, apiKey);

        // Save only metadata to Firestore — key never stored in Firestore
        await adminDb
            .collection("stores")
            .doc(storeId)
            .collection("integrations")
            .doc("sumup")
            .set({
                enabled: true,
                merchantCode: profile.merchant_code,
                merchantName: profile.company_name,
                currency: profile.currency,
                country: profile.country,
                connectedAt: new Date().toISOString(),
            });

        return NextResponse.json({
            connected: true,
            merchantCode: profile.merchant_code,
            merchantName: profile.company_name,
            currency: profile.currency,
        });
    } catch (err: any) {
        console.error("[SumUp Connect Error]", err);
        return NextResponse.json({ error: err.message ?? "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const storeId = searchParams.get("storeId");

        if (!storeId) {
            return NextResponse.json({ error: "storeId required" }, { status: 400 });
        }

        // Remove from Secret Manager
        await deleteSecret(`sumup_${storeId}_apikey`);

        // Remove Firestore metadata
        await adminDb
            .collection("stores")
            .doc(storeId)
            .collection("integrations")
            .doc("sumup")
            .delete();

        return NextResponse.json({ disconnected: true });
    } catch (err: any) {
        console.error("[SumUp Disconnect Error]", err);
        return NextResponse.json({ error: err.message ?? "Internal Server Error" }, { status: 500 });
    }
}
