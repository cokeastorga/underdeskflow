"use client";

import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function CheckoutFailurePage() {
    const params = useParams();
    const storeId = params.storeId as string;

    return (
        <div className="container flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 rounded-full bg-red-100 p-6 dark:bg-red-900/20">
                <XCircle className="h-12 w-12 text-red-600 dark:text-red-500" />
            </div>
            <h1 className="mb-4 text-3xl font-bold tracking-tight">Payment Failed</h1>
            <p className="mb-8 max-w-[600px] text-muted-foreground">
                Unfortunately, your payment could not be processed. Please try again or use a different payment method.
            </p>
            <div className="flex gap-4">
                <Link href={`/${storeId}/checkout`}>
                    <Button>Try Again</Button>
                </Link>
                <Link href={`/${storeId}/cart`}>
                    <Button variant="outline">Return to Cart</Button>
                </Link>
            </div>
        </div>
    );
}
