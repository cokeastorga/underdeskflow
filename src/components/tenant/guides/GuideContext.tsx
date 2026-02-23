"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface GuideContextType {
    completedGuides: string[];
    markGuideAsSeen: (guideId: string) => void;
}

const GuideContext = createContext<GuideContextType | undefined>(undefined);

export function GuideProvider({ children }: { children: React.ReactNode }) {
    const { storeId } = useAuth();
    const [completedGuides, setCompletedGuides] = useState<string[]>([]);

    useEffect(() => {
        if (!storeId) return;
        const fetchGuides = async () => {
            try {
                // We store viewed guides in a separate collection or inside the store document
                // For simplicity, let's use local storage or a subcollection 'userData' -> 'guides'
                // But requirement says "persistence". Let's put it in `stores/{storeId}/userData/{userId}` or just `stores/{storeId}` generic preferences if it's per store.
                // Let's assume it's per store for now to be simple.
                const docRef = doc(db, "stores", storeId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setCompletedGuides(data.seenGuides || []);
                }
            } catch (error) {
                console.error("Error fetching guides", error);
            }
        };
        fetchGuides();
    }, [storeId]);

    const markGuideAsSeen = async (guideId: string) => {
        if (!storeId) return;
        if (completedGuides.includes(guideId)) return;

        const newGuides = [...completedGuides, guideId];
        setCompletedGuides(newGuides);

        try {
            await updateDoc(doc(db, "stores", storeId), {
                seenGuides: newGuides
            });
        } catch (error) {
            console.error("Error saving guide progress", error);
        }
    };

    return (
        <GuideContext.Provider value={{ completedGuides, markGuideAsSeen }}>
            {children}
        </GuideContext.Provider>
    );
}

export function useGuide() {
    const context = useContext(GuideContext);
    if (context === undefined) {
        throw new Error("useGuide must be used within a GuideProvider");
    }
    return context;
}
