import { verifySession } from "@/lib/auth/server-utils";
import { AuthProvider } from "@/lib/firebase/auth-context";
import { TenantShell } from "@/components/tenant/TenantShell";

export default async function TenantLayoutWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    // 1. Server-side Session Verification
    // This runs on the server and uses firebase-admin (Node.js)
    await verifySession();

    // 2. Render Client-side Shell
    // We wrap it in AuthProvider to give children access to client-side auth state
    return (
        <AuthProvider>
            <TenantShell>
                {children}
            </TenantShell>
        </AuthProvider>
    );
}
