"use client";

import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProductFormValues } from "@/lib/validations/product";

interface SectionProps {
    form: UseFormReturn<ProductFormValues>;
}

export function SeoSection({ form }: SectionProps) {
    const title = form.watch("title");
    const description = form.watch("description");
    const slug = form.watch("slug");

    // Sync SEO title and description automatically if they are empty
    useEffect(() => {
        const currentSeoTitle = form.getValues("seo.title");
        if (!currentSeoTitle && title) {
            form.setValue("seo.title", title, { shouldDirty: false });
        }
    }, [title, form]);

    useEffect(() => {
        const currentSeoDesc = form.getValues("seo.description");
        if (!currentSeoDesc && description) {
            form.setValue("seo.description", description, { shouldDirty: false });
        }
    }, [description, form]);

    return (
        <div className="space-y-6">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="p-6">
                    <h3 className="font-semibold mb-4">Vista Previa en Google</h3>
                    <div className="max-w-[600px] select-none rounded bg-white p-4 dark:bg-[#202124]">
                        <div className="mb-1 flex items-center gap-2">
                            <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#f1f3f4] text-xs font-bold text-[#202124]">
                                {title ? title.charAt(0).toUpperCase() : "S"}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm text-[#202124] dark:text-[#dadce0]">Your Store Name</span>
                                <span className="text-xs text-[#5f6368] dark:text-[#bdc1c6]">https://yourstore.com › products › {slug || "slug"}</span>
                            </div>
                        </div>
                        <h4 className="text-xl text-[#1a0dab] hover:underline dark:text-[#8ab4f8] truncate cursor-pointer">
                            {form.watch("seo.title") || title || "Product Title"}
                        </h4>
                        <p className="text-sm text-[#4d5156] dark:text-[#bdc1c6] max-w-full break-words">
                            {form.watch("seo.description") || description || "Product description will appear here. Build a catchy description to improve your click-through rate on search engines."}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                <FormField
                    control={form.control}
                    name="seo.title"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex justify-between">
                                <FormLabel>SEO Title</FormLabel>
                                <span className={`text-xs ${(field.value?.length || 0) > 60 ? "text-red-500" : "text-muted-foreground"}`}>
                                    {field.value?.length || 0}/60
                                </span>
                            </div>
                            <FormControl>
                                <Input placeholder={title} {...field} />
                            </FormControl>
                            <FormDescription>
                                Recommended length: 50-60 characters.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="seo.description"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex justify-between">
                                <FormLabel>SEO Description</FormLabel>
                                <span className={`text-xs ${(field.value?.length || 0) > 160 ? "text-red-500" : "text-muted-foreground"}`}>
                                    {field.value?.length || 0}/160
                                </span>
                            </div>
                            <FormControl>
                                <Textarea
                                    placeholder="Short description for search engines"
                                    className="min-h-[80px]"
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                Recommended length: 150-160 characters.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
}
