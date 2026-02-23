"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { Store } from "@/types/store";
import { StoreSetupWizard } from "@/components/tenant/onboarding/store-setup-wizard";
import { Loader2 } from "lucide-react";

export default function OnboardingPage() {
    const { storeId } = useAuth();
    const [store, setStore] = useState<Store | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (storeId) {
            getDoc(doc(db, "stores", storeId)).then(snap => {
                if (snap.exists()) setStore({ id: snap.id, ...snap.data() } as Store);
            }).finally(() => setLoading(false));
        }
    }, [storeId]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!store) {
        return (
            <div className="flex h-screen items-center justify-center text-muted-foreground">
                No se encontró la tienda.
            </div>
        );
    }

    return <StoreSetupWizard store={store} />;
}
