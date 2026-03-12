import { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
            <AdminSidebar />
            
            <div className="flex-1 flex flex-col min-w-0">
                {/* Slim Topbar for User info/Tenant Context */}
                <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
                    <h2 className="text-sm font-medium text-muted-foreground">Admin Workspace</h2>
                    <div className="flex items-center gap-4">
                        {/* Auth Placeholder */}
                        <div className="h-8 w-8 rounded-full bg-muted border border-border" />
                    </div>
                </header>
                
                {/* Main Scrollable Content */}
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-6xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
