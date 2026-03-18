
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { signOut } from "firebase/auth";

interface AuthContextType {
    user: User | null;
    storeId: string | null;
    role: "platform_admin" | "tenant_admin" | "store_manager" | "cashier" | null;
    store: any | null; // Detailed store data including planId
    loading: boolean;
    refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    storeId: null,
    role: null,
    store: null,
    loading: true,
    refreshAuth: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [storeId, setStoreId] = useState<string | null>(null);
    const [role, setRole] = useState<"platform_admin" | "tenant_admin" | "store_manager" | "cashier" | null>(null);
    const [store, setStore] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshAuth = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        try {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const sId = userData.storeId || null;
                setStoreId(sId);
                setRole(userData.role || null);

                if (sId) {
                    const storeDoc = await getDoc(doc(db, "stores", sId));
                    if (storeDoc.exists()) {
                        setStore({ id: storeDoc.id, ...storeDoc.data() });
                    }
                }
            }
        } catch (error) {
            console.error("Error refreshing auth context:", error);
        }
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
                        const sId = userData.storeId || null;
                        setStoreId(sId);
                        setRole(userData.role || null);

                        if (sId) {
                            const storeDoc = await getDoc(doc(db, "stores", sId));
                            if (storeDoc.exists()) {
                                setStore({ id: storeDoc.id, ...storeDoc.data() });
                            }
                        }
                    } else {
                        setStoreId(null);
                        setRole(null);
                        setStore(null);
                    }
                    setUser(user);
                } catch (error) {
                    console.error("Error during authentication state update:", error);
                    // We don't force logout here to stay resilient to transient network issues
                    // The user will still have an active Firebase Auth session on the client
                }
            } else {
                // User is signed out
                setUser(null);
                setStoreId(null);
                setRole(null);
                setStore(null);

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
        <AuthContext.Provider value={{ user, storeId, role, store, loading, refreshAuth }}>
            {children}
        </AuthContext.Provider>
    );
}
