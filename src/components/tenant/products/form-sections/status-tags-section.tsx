"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ProductFormValues } from "@/lib/validations/product";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tag, X, CircleDot } from "lucide-react";

interface SectionProps {
    form: UseFormReturn<ProductFormValues>;
}

const STATUS_OPTIONS = [
    { value: "active", label: "Activo", description: "Visible en la tienda", color: "bg-green-500" },
    { value: "draft", label: "Borrador", description: "Oculto, aún no publicado", color: "bg-yellow-500" },
    { value: "archived", label: "Archivado", description: "Inactivo, no visible", color: "bg-gray-400" },
] as const;

export function StatusTagsSection({ form }: SectionProps) {
    const [tagInput, setTagInput] = useState("");
    const tags = form.watch("tags") || [];

    const addTag = (value: string) => {
        const trimmed = value.trim().toLowerCase();
        if (!trimmed || tags.includes(trimmed)) return;
        form.setValue("tags", [...tags, trimmed], { shouldDirty: true });
        setTagInput("");
    };

    const removeTag = (index: number) => {
        form.setValue("tags", tags.filter((_, i) => i !== index), { shouldDirty: true });
    };

    return (
        <div className="space-y-6">
            {/* Status */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <CircleDot className="h-4 w-4" /> Estado del Producto
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {STATUS_OPTIONS.map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => field.onChange(option.value)}
                                            className={`flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all ${field.value === option.value
                                                    ? "border-primary bg-primary/5"
                                                    : "border-muted hover:border-muted-foreground/30"
                                                }`}
                                        >
                                            <span className={`mt-1 h-3 w-3 rounded-full flex-shrink-0 ${option.color}`} />
                                            <div>
                                                <p className="font-medium text-sm">{option.label}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

            {/* Tags */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Tag className="h-4 w-4" /> Etiquetas
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <FormField
                        control={form.control}
                        name="tags"
                        render={() => (
                            <FormItem>
                                <FormDescription>
                                    Agrega etiquetas para facilitar la búsqueda. Presiona Enter para añadir.
                                </FormDescription>
                                <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-muted/20">
                                    {tags.map((tag, index) => (
                                        <Badge
                                            key={index}
                                            variant="secondary"
                                            className="flex items-center gap-1 pr-1 text-sm"
                                        >
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => removeTag(index)}
                                                className="ml-1 rounded-full hover:bg-destructive/20 hover:text-destructive p-0.5 transition-colors"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                    <Input
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                addTag(tagInput);
                                            }
                                            if (e.key === "Backspace" && !tagInput && tags.length > 0) {
                                                removeTag(tags.length - 1);
                                            }
                                        }}
                                        placeholder={tags.length === 0 ? "Ej: verano, oferta, nuevo..." : ""}
                                        className="border-0 bg-transparent h-7 p-0 text-sm focus-visible:ring-0 flex-1 min-w-[120px] placeholder:text-muted-foreground/60"
                                    />
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
