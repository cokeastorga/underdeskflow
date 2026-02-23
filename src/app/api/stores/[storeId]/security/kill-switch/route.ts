/**
 * Security API — Global Kill Switch
 * 
 * POST /api/stores/[storeId]/security/kill-switch
 * 
 * Body: { active: boolean }
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/firebase/admin-auth";
import { SecurityGuardService } from "@/lib/security/security-guard.service";

export const runtime = "nodejs";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ storeId: string }> }
): Promise<NextResponse> {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await verifyAuth(token).catch(() => null);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // TODO: Verify if user is OWNER of the store

    const { storeId } = await params;
    const { active } = await req.json();

    try {
        await SecurityGuardService.toggleKillSwitch(storeId, active);

        return NextResponse.json({
            success: true,
            active,
            timestamp: Date.now()
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
