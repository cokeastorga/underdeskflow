"use client";

import { useState, useEffect } from "react";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, RefreshCw, Copy } from "lucide-react";
import { ProductFormValues, ProductOptionSchema } from "@/lib/validations/product";
import { Switch } from "@/components/ui/switch";

interface SectionProps {
    form: UseFormReturn<ProductFormValues>;
}

export function VariantsSection({ form }: SectionProps) {
    const hasVariants = form.watch("hasVariants");

    // Options Management (Size, Color)
    const { fields: optionFields, append: appendOption, remove: removeOption, update: updateOption, replace: replaceOptions } = useFieldArray({
        control: form.control,
        name: "options",
    });

    // Variants Management (The actual SKUs)
    const { fields: variantFields, replace: replaceVariants, update: updateVariant } = useFieldArray({
        control: form.control,
        name: "variants",
    });

    // Helper to add a value to an option
    const addValueToOption = (index: number, value: string) => {
        if (!value) return;
        const option = optionFields[index];
        const newValues = [...option.values, value];
        updateOption(index, { ...option, values: newValues });
    };

    const removeValueFromOption = (optionIndex: number, valueIndex: number) => {
        const option = optionFields[optionIndex];
        const newValues = option.values.filter((_, i) => i !== valueIndex);
        updateOption(optionIndex, { ...option, values: newValues });
    };

    // Generate Cartesian Product of Variants
    const generateVariants = () => {
        const options = form.getValues("options");
        if (options.length === 0) return;

        // Cartesian product helper
        const cartesian = (args: string[][]) => args.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())), [[]] as string[][]);

        const valueArrays = options.map(o => o.values);
        // If any option has no values, we can't generate variants properly yet? 
        // Or we generate partials? Let's assume strictness for now.
        if (valueArrays.some(arr => arr.length === 0)) {
            // Toast error?
            return;
        }

        const combinations = cartesian(valueArrays);

        const newVariants = combinations.map((combination) => {
            const variantOptions: Record<string, string> = {};
            options.forEach((opt, index) => {
                variantOptions[opt.name] = combination[index];
            });

            const title = combination.join(" / ");

            // Check if variant already exists to preserve SKU/Price/Stock
            const existing = variantFields.find(v => v.title === title);

            if (existing) return existing;

            return {
                id: crypto.randomUUID(),
                title: title,
                options: variantOptions,
                status: "active" as const,
                price: form.getValues("price") || 0, // Inherit base price
                stock: 0,
                trackStock: true,
                allowBackorder: false,
                sku: "",
                image: "",
            };
        });

        replaceVariants(newVariants);
        form.clearErrors("variants");
    };

    if (!hasVariants) {
        return (
            <div className="flex items-start space-x-3 p-4 border rounded-md bg-muted/20">
                <FormField
                    control={form.control}
                    name="hasVariants"
                    render={({ field }) => (
                        <>
                            <Switch
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                    field.onChange(checked);
                                    if (checked && optionFields.length === 0) {
                                        appendOption({ id: crypto.randomUUID(), name: "Size", values: [] });
                                    }
                                }}
                            />
                            <div className="space-y-1">
                                <FormLabel>This product has variants</FormLabel>
                                <FormDescription>
                                    Enable this if your product comes in multiple options like size or color.
                                </FormDescription>
                            </div>
                        </>
                    )}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-start space-x-3 p-4 border-b">
                <FormField
                    control={form.control}
                    name="hasVariants"
                    render={({ field }) => (
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                            <FormLabel className="m-0">Enable Variants</FormLabel>
                        </div>
                    )}
                />
            </div>

            {/* Options Config */}
            <div className="flex items-center gap-4 p-4 bg-muted/20 border rounded-md">
                <div className="flex-1">
                    <FormLabel>Cargar Plantilla Rápida</FormLabel>
                    <FormDescription>Selecciona una plantilla para rellenar las opciones automáticamente.</FormDescription>
                </div>
                <select
                    className="h-9 w-[200px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;

                        // Clear existing? Or append? Let's replace for simplicity as it's a "Preset"
                        // Confirmation could be nice but for V1 let's just do it.

                        let newOptions: { id: string; name: string; values: string[] }[] = [];

                        if (val === 'clothing') {
                            newOptions = [
                                { id: crypto.randomUUID(), name: "Talla", values: ["S", "M", "L", "XL"] },
                                { id: crypto.randomUUID(), name: "Color", values: ["Negro", "Blanco", "Azul"] }
                            ];
                        } else if (val === 'shoes') {
                            newOptions = [
                                { id: crypto.randomUUID(), name: "Talla EU", values: ["38", "39", "40", "41", "42"] }
                            ];
                        } else if (val === 'food') {
                            newOptions = [
                                { id: crypto.randomUUID(), name: "Porción", values: ["Pequeña", "Mediana", "Grande"] }
                            ];
                        }

                        if (newOptions.length > 0) {
                            replaceOptions(newOptions);
                            replaceVariants([]); // Clear stale generated variants
                        }

                        e.target.value = ""; // Reset
                    }}
                >
                    <option value="">Seleccionar Plantilla...</option>
                    <option value="clothing">Ropa (Talla/Color)</option>
                    <option value="shoes">Zapatos (Tallas EU)</option>
                    <option value="food">Comida (Porciones)</option>
                </select>
            </div>

            <div className="space-y-4">
                {optionFields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-md relative bg-muted/10">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                            onClick={() => removeOption(index)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>

                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <FormLabel>Option Name</FormLabel>
                                <Input
                                    value={field.name}
                                    onChange={(e) => updateOption(index, { ...field, name: e.target.value })}
                                    className={form.formState.errors.options?.[index]?.name ? "border-destructive" : ""}
                                />
                                {form.formState.errors.options?.[index]?.name && (
                                    <p className="text-[0.8rem] font-medium text-destructive">
                                        {form.formState.errors.options[index]?.name?.message}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <FormLabel>Option Values</FormLabel>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {field.values.map((val, vIndex) => (
                                        <div key={vIndex} className="bg-primary/10 text-primary px-2 py-1 rounded-md text-sm flex items-center gap-1">
                                            {val}
                                            <button
                                                type="button"
                                                onClick={() => removeValueFromOption(index, vIndex)}
                                                className="hover:text-destructive"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                {form.formState.errors.options?.[index]?.values && (
                                    <p className="text-[0.8rem] font-medium text-destructive">
                                        {form.formState.errors.options[index]?.values?.message}
                                    </p>
                                )}
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Add value (e.g. Small, Red)"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const target = e.target as HTMLInputElement;
                                                addValueToOption(index, target.value);
                                                target.value = "";
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                <Button type="button" variant="outline" onClick={() => appendOption({ id: crypto.randomUUID(), name: "", values: [] })}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add another option
                </Button>
            </div>

            <div className="flex justify-end pt-4 border-t">
                <Button type="button" onClick={generateVariants} className="w-full md:w-auto">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate Variants
                </Button>
            </div>

            <FormField
                control={form.control}
                name="variants"
                render={() => <FormMessage className="mt-2" />}
            />

            {/* Variants Table (Desktop) */}
            {variantFields.length > 0 && (
                <div className="space-y-4">
                    <h3 className="font-medium">Preview ({variantFields.length} variants)</h3>

                    {/* Desktop Table */}
                    <div className="hidden md:block border rounded-md overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Variant</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Barcode</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {variantFields.map((variant, index) => (
                                    <TableRow key={variant.id}>
                                        <TableCell className="font-medium">{variant.title}</TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                className="w-24"
                                                {...form.register(`variants.${index}.price` as const, { valueAsNumber: true })}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                className="w-20"
                                                {...form.register(`variants.${index}.stock` as const, { valueAsNumber: true })}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                className="w-28"
                                                {...form.register(`variants.${index}.sku` as const)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                className="w-28"
                                                {...form.register(`variants.${index}.barcode` as const)}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                        {variantFields.map((variant, index) => (
                            <div key={variant.id} className="p-4 border rounded-md bg-card space-y-3">
                                <div className="font-medium text-lg">{variant.title}</div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <FormLabel className="text-xs">Precio</FormLabel>
                                        <Input
                                            type="number"
                                            {...form.register(`variants.${index}.price` as const, { valueAsNumber: true })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <FormLabel className="text-xs">Stock</FormLabel>
                                        <Input
                                            type="number"
                                            {...form.register(`variants.${index}.stock` as const, { valueAsNumber: true })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <FormLabel className="text-xs">SKU</FormLabel>
                                    <Input
                                        {...form.register(`variants.${index}.sku` as const)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
