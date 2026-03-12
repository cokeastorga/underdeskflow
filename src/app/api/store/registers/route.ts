import { NextRequest, NextResponse } from "next/server";
import { getRegisters } from "@/domains/store/services.server";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const storeId = searchParams.get("storeId");
        const branchId = searchParams.get("branchId") || undefined;

        if (!storeId) {
            return NextResponse.json({ error: "storeId required" }, { status: 400 });
        }

        const registers = await getRegisters(storeId, branchId);
        return NextResponse.json({ registers });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
