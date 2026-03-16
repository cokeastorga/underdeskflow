import { StatCard } from "@/components/admin/StatCard";
import { DollarSign, ShoppingCart, AlertTriangle, Package } from "lucide-react";
import { ActivationWizard } from "@/components/admin/ActivationWizard";
import { ActivationStatus, ActivationSteps } from "@/domains/tenants/types";
import { getFinancialAnalytics } from "@/domains/analytics/services.server";
import { FinancialStats } from "@/components/admin/dashboard/FinancialStats";

function fmt(amount: number) {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(amount);
}

export default async function AdminDashboard() {
    // Demo Hardcoded tenant. 
    // In Production this comes from auth: e.g. const auth = await getSession(); auth.storeId 
    const storeId = "SntHndq7Bv9n2cM82kG0"; // "Delicias Porteñas" demo store

    const financials = await getFinancialAnalytics(storeId);

    const stats = {
        salesToday: financials.grossSales, // Quick alias mapped to the new analytics service
        ordersToday: financials.orderCount,
        lowStock: 0,
        products: 1 // The demo product we provisioned during signup
    };
    
    // Simulating a fresh provisioned branch that needs onboarding activation
    const mockActivationStatus: ActivationStatus = "PENDING";
    const mockActivationSteps: ActivationSteps = {
        logoUploaded: false,
        firstProductCreated: false,
        paymentsConnected: false,
        testOrderCompleted: false
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Dashboard Financiero y Operativo</h1>
                <p className="text-muted-foreground">Bienvenido al Retail OS. Administra tu negocio desde este centro de mando.</p>
            </div>

            {mockActivationStatus === "PENDING" && (
                <div className="mb-6">
                    <ActivationWizard status={mockActivationStatus} steps={mockActivationSteps} />
                </div>
            )}

            {/* Financial Overview / Payout Visibility */}
            <FinancialStats 
                grossSales={financials.grossSales}
                platformFees={financials.platformFees}
                netSales={financials.grossSales - financials.platformFees} 
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    title="Ventas Acumuladas" 
                    value={fmt(stats.salesToday)} 
                    icon={<DollarSign />} 
                    trend="up"
                    description="+15% vs ayer"
                />
                
                <StatCard 
                    title="Órdenes (Total)" 
                    value={stats.ordersToday} 
                    icon={<ShoppingCart />} 
                    trend="up"
                    description="POS, Web & MercadoLibre"
                />
                
                <StatCard 
                    title="Alertas de Stock" 
                    value={stats.lowStock} 
                    icon={<AlertTriangle className={stats.lowStock > 0 ? "text-amber-500" : ""} />} 
                    description={stats.lowStock > 0 ? "Requiere reposición" : "Stock saludable"}
                />
                
                <StatCard 
                    title="Catálogo Activo" 
                    value={stats.products} 
                    icon={<Package />} 
                    description="Productos publicados"
                />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                {/* Visual Placeholders for deeper architecture down the line */}
                <div className="border border-border rounded-xl bg-card p-6 h-64 flex flex-col justify-center items-center text-muted-foreground">
                    Gráfico de Ventas por Canal
                </div>
                
                <div className="border border-border rounded-xl bg-card p-6 h-64 flex flex-col justify-center items-center text-muted-foreground">
                    Turnos de Caja Activos
                </div>
            </div>
        </div>
    );
}
