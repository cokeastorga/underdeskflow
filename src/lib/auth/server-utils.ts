import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin-config";
import { redirect } from "next/navigation";

export async function verifySession() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value;

    if (!sessionCookie) {
        redirect("/login");
    }

    try {
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
        return decodedClaims;
    } catch (error) {
        console.error("Session verification failed", error);
        redirect("/login");
    }
}
