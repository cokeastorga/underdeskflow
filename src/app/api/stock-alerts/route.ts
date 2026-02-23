/**
 * Stock Alerts API
 *
 * GET    /api/stock-alerts?storeId=   — list rules for the store
 * POST   /api/stock-alerts            — create or update a rule
 * DELETE /api/stock-alerts?storeId=&ruleId=  — delete a rule
 *
 * Auth: Firebase ID token
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/firebase/admin-auth";
import {
    getStockAlertRules,
    upsertStockAlertRule,
    deleteStockAlertRule,
    checkStockAlerts,
} from "@/lib/payments/reporting.service";
import { StockAlertRule } from "@/types/reporting";

export const runtime = "nodejs";

// ─── GET: list rules + optionally evaluate ─────────────────────────────────────
export async function GET(req: NextRequest): Promise<NextResponse> {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await verifyAuth(token).catch(() => null);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const storeId = searchParams.get("storeId");
    const evaluate = searchParams.get("evaluate") === "true";

    if (!storeId) return NextResponse.json({ error: "Missing storeId" }, { status: 400 });

    const rules = await getStockAlertRules(storeId);

    if (evaluate) {
        const triggered = await checkStockAlerts(storeId);
        return NextResponse.json({ rules, triggered });
    }

    return NextResponse.json({ rules });
}

// ─── POST: upsert a rule ───────────────────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse> {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await verifyAuth(token).catch(() => null);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
        storeId?: string;
        productId?: string;
        sku?: string;
        productName?: string;
        threshold?: number;
        criticalFloor?: number;
        enabled?: boolean;
    };

    const { storeId, productId, sku, productName, threshold, criticalFloor, enabled = true } = body;

    if (!storeId || !productId || !sku || !productName || threshold === undefined) {
        return NextResponse.json(
            { error: "Missing required fields: storeId, productId, sku, productName, threshold" },
            { status: 400 }
        );
    }
    if (threshold < 0) {
        return NextResponse.json({ error: "threshold must be ≥ 0" }, { status: 422 });
    }

    const rule = await upsertStockAlertRule(storeId, {
        productId, sku, productName, threshold,
        ...(criticalFloor !== undefined ? { criticalFloor } : {}),
        enabled,
    });

    return NextResponse.json({ rule }, { status: 201 });
}

// ─── DELETE: remove a rule ─────────────────────────────────────────────────────
export async function DELETE(req: NextRequest): Promise<NextResponse> {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await verifyAuth(token).catch(() => null);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const storeId = searchParams.get("storeId");
    const ruleId = searchParams.get("ruleId");

    if (!storeId || !ruleId) {
        return NextResponse.json({ error: "Missing storeId and ruleId" }, { status: 400 });
    }

    await deleteStockAlertRule(storeId, ruleId);
    return NextResponse.json({ ok: true });
}
