import { NextRequest, NextResponse } from "next/server";
import { processTenantOnboarding } from "@/domains/tenants/services.server";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
    const requestId = crypto.randomUUID();
    
    try {
        const body = await req.json();
        const { email, storeName, slug } = body;
        
        if (!email || !storeName || !slug) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }
        
        logger.info("Starting Tenant Provisioning", { requestId, email, storeName, slug });
        
        const startTime = Date.now();
        const config = await processTenantOnboarding(email, storeName, slug);
        const duration = Date.now() - startTime;
        
        logger.info("Tenant Provisioning Complete", { 
            requestId, 
            storeId: config.storeId, 
            durationMs: duration 
        });
        
        return NextResponse.json({
            success: true,
            storeId: config.storeId,
            domain: config.defaultDomain,
            durationMs: duration
        });
        
    } catch (error: any) {
        logger.error("Tenant Provisioning Failed", { requestId, error });
        return NextResponse.json({ error: "Provisioning Error" }, { status: 500 });
    }
}
