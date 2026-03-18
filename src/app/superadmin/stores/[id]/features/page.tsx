import { getStoreFeatures, getStoreBasicInfo } from "./actions";
import FeatureClient from "./FeatureClient";

export default async function StoreFeaturesPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: storeId } = await params;
    const [features, storeInfo] = await Promise.all([
        getStoreFeatures(storeId),
        getStoreBasicInfo(storeId)
    ]);

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <FeatureClient 
                storeId={storeId} 
                storeName={storeInfo.name} 
                initialFeatures={features} 
            />
        </div>
    );
}
