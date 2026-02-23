import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { Banner } from "@/types";
import { BannerForm } from "@/components/tenant/marketing/banners/banner-form";

interface Props {
    params: Promise<{ bannerId: string }>;
}

export default async function BannerPage({ params }: Props) {
    const resolvedParams = await params;
    const bannerId = resolvedParams.bannerId;
    let banner: Banner | null = null;

    if (bannerId !== "new") {
        const docRef = doc(db, "banners", bannerId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            banner = { id: docSnap.id, ...docSnap.data() } as Banner;
        }
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <BannerForm initialData={banner} />
        </div>
    );
}
