import { adminDb } from "@/lib/firebase/admin-config";
import { createCategory, createProduct, createVariant } from "@/domains/catalog/services.server";

export async function processTenantOnboarding(email: string, storeName: string, storeSlug: string) {
    // We are performing multiple fast operations without a pure single transaction to avoid 500-document limits,
    // but in a sequential safe order where failure mid-way can be retried or cleaned up via a worker.
    
    // 1. Create User/Account
    const userRef = adminDb.collection("users").doc();
    const accountId = `acc_${userRef.id}`;
    const now = Date.now();
    
    await userRef.set({
        id: accountId,
        email,
        plan: "Basic",
        createdAt: now,
    });
    
    // 2. Create Store (Tenant)
    const storeRef = adminDb.collection("stores").doc();
    const storeId = `store_${storeRef.id}`;
    
    await storeRef.set({
        id: storeId,
        accountId,
        name: storeName,
        slug: storeSlug,
        plan: "starter",
        isActive: true,
        activationStatus: "PENDING",
        activationSteps: {
            logoUploaded: false,
            firstProductCreated: false, // The seed catalog counts, but we want them to upload their own first. Let's start false.
            paymentsConnected: false,
            testOrderCompleted: false
        },
        createdAt: now
    });
    
    // 3. Create Custom Domain Placeholder
    const domainRef = adminDb.collection("domains").doc(`${storeSlug}.udf.cl`);
    await domainRef.set({
        domain: `${storeSlug}.udf.cl`,
        storeId,
        type: "subdomain",
        verified: true, // Auto-verified since it's our own infra
        createdAt: now
    });
    
    // 4. Create Default Branch
    const branchRef = adminDb.collection("branches").doc();
    const branchId = `branch_${branchRef.id}`;
    
    await branchRef.set({
        id: branchId,
        storeId,
        name: "Sucursal Principal",
        type: "MAIN",
        isActive: true,
        createdAt: now
    });
    
    // 5. Create Default POS Register
    const registerRef = adminDb.collection("registers").doc();
    const registerId = `reg_${registerRef.id}`;
    
    await registerRef.set({
        id: registerId,
        storeId,
        branchId,
        name: "Caja 1",
        isActive: true,
        createdAt: now
    });
    
    // 6. Seed Basic Catalog (So the environment isn't empty)
    await seedCatalog(storeId);
    
    // In Production: Dispatch async worker here to generate storefront cache & search indexing
    // emitEvent("tenant.provisioned", { storeId, accountId });
    
    return { storeId, accountId, defaultDomain: `${storeSlug}.udf.cl` };
}

async function seedCatalog(storeId: string) {
    // Create a base category
    const cat = await createCategory(storeId, {
        name: "Catálogo Base",
        description: "Tus primeros productos irán aquí"
    });
    
    // Create a base product
    const prod = await createProduct(storeId, {
        name: "Producto de Ejemplo",
        categoryId: cat.id,
        description: "Usa este producto como referencia"
    });
    
    // Create a base variant
    await createVariant(storeId, prod.id, {
        sku: "DEMO-001",
        name: "Estandar",
        basePrice: 1500
    });
}
