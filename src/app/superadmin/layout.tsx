import { ReactNode } from "react";
import { SuperAdminSidebar } from "@/components/superadmin/SuperAdminSidebar";
import { verifySession } from "@/lib/auth/server-utils";
import { adminDb } from "@/lib/firebase/admin-config";
import { redirect } from "next/navigation";

export default async function SuperAdminLayout({ children }: { children: ReactNode }) {
    // 1. Server-side session verification — only superadmins may enter.
    const session = await verifySession();
    
    // 2. Check the user's role from Firestore (cannot be faked via client token)
    const userSnap = await adminDb.collection("users").doc(session!.uid).get();
    const role = userSnap.data()?.role;
    
    if (role !== "platform_admin") {
        redirect("/tenant"); // Non-privileged users go to their own dashboard
    }

    return (
        <div className="flex h-screen w-full bg-zinc-950 overflow-hidden text-zinc-100">
            <SuperAdminSidebar />

            <div className="flex-1 flex flex-col min-w-0">
                {/* HQ Topbar */}
                <header className="h-16 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-medium text-zinc-400 tracking-wider uppercase">HQ · Plataforma Activa</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-zinc-500">UnderDeskFlow © 2026</span>
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-violet-500/20">
                            SA
                        </div>
                    </div>
                </header>

                {/* Main scrollable content */}
                <main className="flex-1 overflow-y-auto bg-zinc-950">
                    {children}
                </main>
            </div>
        </div>
    );
}
