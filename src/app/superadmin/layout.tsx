import { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
            <AdminSidebar />
            
            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
                    <h2 className="text-sm font-medium text-muted-foreground">SuperAdmin Workspace</h2>
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                            SA
                        </div>
                    </div>
                </header>
                
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
