"use client";

import { UseFormReturn } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ProductFormValues } from "@/lib/validations/product";

interface SectionProps {
    form: UseFormReturn<ProductFormValues>;
}

export function PricingSection({ form }: SectionProps) {
    const hasVariants = form.watch("hasVariants");

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                disabled={hasVariants}
                                placeholder="0.00"
                                {...field}
                            />
                        </FormControl>
                        {hasVariants && <FormDescription>Based on variants</FormDescription>}
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="compareAtPrice"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Compare at Price</FormLabel>
                        <FormControl>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                            />
                        </FormControl>
                        <FormDescription>Original price (for sales)</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="costPrice"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Cost per Item</FormLabel>
                        <FormControl>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                            />
                        </FormControl>
                        <FormDescription>Customers won't see this</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
}
