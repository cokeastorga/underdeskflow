import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { Store } from "@/types/store";
import { notFound } from "next/navigation";

interface StoreLayoutProps {
    children: React.ReactNode;
    params: Promise<{ storeId: string }>;
}

export default async function StoreLayout({
    children,
    params,
}: StoreLayoutProps) {
    const resolvedParams = await params;
    const storeId = resolvedParams.storeId;

    // Fetch Store Profile
    const docRef = doc(db, "stores", storeId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        return notFound();
    }

    const store = docSnap.data() as Store;

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar store={store} />
            <main className="flex-1 flex flex-col">{children}</main>
            <Footer store={store} />
            {store.design?.customCSS && (
                <style dangerouslySetInnerHTML={{ __html: store.design.customCSS }} />
            )}
        </div>
    );
}
