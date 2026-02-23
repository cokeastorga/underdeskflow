import { EditProductLoader } from "./loader";

interface PageProps {
    params: Promise<{
        productId: string;
    }>;
}

export default async function EditProductPage({ params }: PageProps) {
    const { productId } = await params;

    return (
        <div className="max-w-5xl mx-auto py-8">
            <EditProductLoader productId={productId} />
        </div>
    );
}
