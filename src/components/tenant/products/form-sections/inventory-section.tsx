"use client";

import { UseFormReturn } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox"; // Assuming Checkbox component exists or using basic input
import { Switch } from "@/components/ui/switch";
import { ProductFormValues } from "@/lib/validations/product";

interface SectionProps {
    form: UseFormReturn<ProductFormValues>;
}

export function InventorySection({ form }: SectionProps) {
    const trackStock = form.watch("trackStock");
    const hasVariants = form.watch("hasVariants");
    const variants = form.watch("variants");

    // Calculate total stock for display if variants exist
    const totalVariantStock = variants?.reduce((acc, v) => acc + (Number(v.stock) || 0), 0) || 0;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>SKU</FormLabel>
                            <FormControl>
                                <Input placeholder="Stock Keeping Unit" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="barcode"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Barcode (UPC/EAN)</FormLabel>
                            <FormControl>
                                <Input placeholder="ISBN, UPC, GTIN, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="lowStockThreshold"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Low Stock Alert</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    placeholder="e.g. 5"
                                    min="0"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <FormField
                control={form.control}
                name="trackStock"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <FormLabel>Track Quantity</FormLabel>
                            <FormDescription>
                                Monitor stock levels for this product
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                )}
            />

            {trackStock && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hasVariants ? (
                        <div className="rounded-md border p-3 bg-muted/50">
                            <FormLabel>Total Stock (Variants)</FormLabel>
                            <div className="text-2xl font-bold mt-1">{totalVariantStock}</div>
                            <FormDescription>
                                Managed automatically based on variant stock levels.
                            </FormDescription>
                        </div>
                    ) : (
                        <FormField
                            control={form.control}
                            name="stock"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Quantity</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="0"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    <FormField
                        control={form.control}
                        name="allowBackorder"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        checked={field.value}
                                        onChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel className="cursor-pointer">
                                        Continue selling when out of stock
                                    </FormLabel>
                                </div>
                            </FormItem>
                        )}
                    />
                </div>
            )}
        </div>
    );
}
