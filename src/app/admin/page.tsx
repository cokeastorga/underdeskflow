import { StatCard } from "@/components/admin/StatCard";
import { DollarSign, ShoppingCart, AlertTriangle, Package } from "lucide-react";
import { ActivationWizard } from "@/components/admin/ActivationWizard";
import { ActivationStatus, ActivationSteps } from "@/domains/tenants/types";

function fmt(amount: number) {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(amount);
}

export default async function AdminDashboard() {
    // In Production this would await something like:
    // const stats = await getDashboardStats(tenantId)
    // using Firestore aggregation counts or the `sales.ts` Worker aggregation doc.
    const stats = {
        salesToday: 0,
        ordersToday: 0,
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
                <h1 className="text-2xl font-bold tracking-tight">Dashboard Operativo</h1>
                <p className="text-muted-foreground">Bienvenido al Retail OS. Administra tu negocio desde este centro de mando.</p>
            </div>

            {mockActivationStatus === "PENDING" && (
                <div className="mb-8">
                    <ActivationWizard status={mockActivationStatus} steps={mockActivationSteps} />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    title="Ventas de Hoy" 
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
