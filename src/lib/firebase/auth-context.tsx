
"use client";

import { createContext, useContext, useEffect, useState, Suspense, useCallback } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { signOut } from "firebase/auth";
import { useSearchParams } from "next/navigation";

interface AuthContextType {
    user: User | null;
    storeId: string | null;
    role: "platform_admin" | "tenant_admin" | "store_manager" | "cashier" | null;
    store: any | null; // Detailed store data including planId
    loading: boolean;
    isImpersonating: boolean;
    refreshAuth: () => Promise<void>;
    stopImpersonating: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    storeId: null,
    role: null,
    store: null,
    loading: true,
    isImpersonating: false,
    refreshAuth: async () => {},
    stopImpersonating: async () => {},
});

export const useAuth = () => useContext(AuthContext);

function getCookie(name: string) {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift();
    return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [storeId, setStoreId] = useState<string | null>(null);
    const [role, setRole] = useState<"platform_admin" | "tenant_admin" | "store_manager" | "cashier" | null>(null);
    const [store, setStore] = useState<any | null>(null);
    const [isImpersonating, setIsImpersonating] = useState(false);
    const [loading, setLoading] = useState(true);

    const refreshAuth = useCallback(async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        try {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const actualRole = userData.role as any || null;
                setRole(actualRole);

                // Handle impersonation for platform admins
                const impId = getCookie("udf_impersonate");
                const sId = (actualRole === "platform_admin" && impId) ? impId : (userData.storeId || null);
                
                setStoreId(sId);
                setIsImpersonating(!!(actualRole === "platform_admin" && impId));

                if (sId) {
                    const storeDoc = await getDoc(doc(db, "stores", sId));
                    if (storeDoc.exists()) {
                        setStore({ id: storeDoc.id, ...storeDoc.data() });
                    }
                } else {
                    setStore(null);
                }
            }
        } catch (error) {
            console.error("Error refreshing auth context:", error);
        }
    }, []);

    const stopImpersonating = async () => {
        await fetch("/api/superadmin/impersonate", { method: "DELETE" });
        setIsImpersonating(false);
        refreshAuth();
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User is signed in
                try {
                    const idToken = await user.getIdToken();

                    // Sync session with server with timeout
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 10000);

                    try {
                        const syncRes = await fetch("/api/auth/login", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ idToken }),
                            signal: controller.signal
                        });
                        clearTimeout(timeoutId);

                        if (!syncRes.ok) {
                            console.warn("Session sync returned not ok, continuing anyway...");
                        }
                    } catch (err) {
                        clearTimeout(timeoutId);
                        console.error("Session sync failed or timed out:", err);
                        // We don't force logout here to avoid infinite loops if the API is down
                        // The user will just have a client-side session for now
                    }

                    // Fetch user profile
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        const actualRole = userData.role || null;
                        setRole(actualRole);

                        // Handle impersonation for platform admins
                        const impId = getCookie("udf_impersonate");
                        const sId = (actualRole === "platform_admin" && impId) ? impId : (userData.storeId || null);
                        
                        setStoreId(sId);
                        setIsImpersonating(!!(actualRole === "platform_admin" && impId));

                        if (sId) {
                            const storeDoc = await getDoc(doc(db, "stores", sId));
                            if (storeDoc.exists()) {
                                setStore({ id: storeDoc.id, ...storeDoc.data() });
                            }
                        } else {
                            setStore(null);
                        }
                    } else {
                        // SELF-HEALING: If it's Jorge and profile is missing, recreate it
                        if (user.email === "jor.astorga@ccsolution.cl") {
                            console.log("[Auth] Recreating missing profile for platform_admin");
                            const newProfile = {
                                email: user.email,
                                role: "platform_admin",
                                createdAt: Date.now(),
                                onboardingComplete: true
                            };
                            await setDoc(doc(db, "users", user.uid), newProfile);
                            setRole("platform_admin");
                            
                            // Check impersonation for the newly created profile too
                            const impId = getCookie("udf_impersonate");
                            if (impId) {
                                setStoreId(impId);
                                setIsImpersonating(true);
                                const storeDoc = await getDoc(doc(db, "stores", impId));
                                if (storeDoc.exists()) {
                                    setStore({ id: storeDoc.id, ...storeDoc.data() });
                                }
                            }
                        } else {
                            setStoreId(null);
                            setRole(null);
                            setStore(null);
                            setIsImpersonating(false);
                        }
                    }
                    setUser(user);
                } catch (error) {
                    console.error("Error during authentication state update:", error);
                }
            } else {
                // User is signed out
                setUser(null);
                setStoreId(null);
                setRole(null);
                setStore(null);
                setIsImpersonating(false);

                // Clear server session
                await fetch("/api/auth/logout", { method: "POST" });
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        await signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, storeId, role, store, loading, isImpersonating, refreshAuth, stopImpersonating }}>
            <Suspense fallback={null}>
                <PaymentRefreshHandler refreshAuth={refreshAuth} />
            </Suspense>
            {children}
        </AuthContext.Provider>
    );
}

function PaymentRefreshHandler({ refreshAuth }: { refreshAuth: () => Promise<void> }) {
    const searchParams = useSearchParams();
    useEffect(() => {
        const mpStatus = searchParams.get("mp_status");
        if (mpStatus === "approved" || mpStatus === "success") {
            console.log("[Auth] Payment success detected in URL. Refreshing context...");
            refreshAuth();
        }
    }, [searchParams, refreshAuth]);
    return null;
}
