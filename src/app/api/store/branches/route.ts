import { NextRequest, NextResponse } from "next/server";
import { getBranches } from "@/domains/store/services.server";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const storeId = searchParams.get("storeId");

        if (!storeId) {
            return NextResponse.json({ error: "storeId required" }, { status: 400 });
        }

        const branches = await getBranches(storeId);
        return NextResponse.json({ branches });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
