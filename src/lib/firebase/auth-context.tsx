
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { signOut } from "firebase/auth";

interface AuthContextType {
    user: User | null;
    storeId: string | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    storeId: null,
    loading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [storeId, setStoreId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User is signed in
                try {
                    const idToken = await user.getIdToken();

                    // Sync session with server
                    await fetch("/api/auth/login", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ idToken }),
                    });

                    // Fetch user profile
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        setStoreId(userDoc.data().storeId || null);
                    } else {
                        setStoreId(null);
                    }
                    setUser(user);
                } catch (error) {
                    console.error("Error syncing session:", error);
                    // If session sync fails, force logout
                    await signOut(auth);
                    setUser(null);
                    setStoreId(null);
                }
            } else {
                // User is signed out
                setUser(null);
                setStoreId(null);

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
        <AuthContext.Provider value={{ user, storeId, loading }}>
            {children}
        </AuthContext.Provider>
    );
}
