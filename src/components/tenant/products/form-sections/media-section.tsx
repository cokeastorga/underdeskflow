"use client";

import { useState } from "react";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Plus, Image as ImageIcon, Link as LinkIcon, Star } from "lucide-react";
import { ProductFormValues } from "@/lib/validations/product";

interface SectionProps {
    form: UseFormReturn<ProductFormValues>;
}

export function MediaSection({ form }: SectionProps) {
    const { fields, append, remove, update } = useFieldArray({
        control: form.control,
        name: "media",
    });

    const [urlInput, setUrlInput] = useState("");
    const [activeTab, setActiveTab] = useState("url");

    const handleAddUrl = () => {
        if (!urlInput) return;

        append({
            id: crypto.randomUUID(),
            url: urlInput,
            type: "image",
            isPrimary: fields.length === 0, // First one is primary by default
            order: fields.length,
        });
        setUrlInput("");
    };

    const setPrimary = (index: number) => {
        fields.forEach((field, i) => {
            update(i, { ...field, isPrimary: i === index });
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <FormLabel className="text-base">Media</FormLabel>
                <div className="text-xs text-muted-foreground">
                    {fields.length} images
                </div>
            </div>

            {/* Input Area */}
            <div className="bg-muted/30 p-4 rounded-lg border border-dashed">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="url">
                            <LinkIcon className="h-4 w-4 mr-2" />
                            Add from URL
                        </TabsTrigger>
                        <TabsTrigger value="upload" disabled>
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Upload File (Soon)
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="url" className="space-y-3">
                        <div className="flex gap-2">
                            <Input
                                placeholder="https://example.com/image.jpg"
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddUrl();
                                    }
                                }}
                            />
                            <Button type="button" onClick={handleAddUrl} size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Add
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Paste a direct link to an image (JPG, PNG, WEBP).
                        </p>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Gallery Grid */}
            {fields.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {fields.map((field, index) => (
                        <Card key={field.id} className={`overflow-hidden relative group ${field.isPrimary ? 'ring-2 ring-primary' : ''}`}>
                            <div className="aspect-square relative bg-muted flex items-center justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={field.url}
                                    alt="Product media"
                                    className="object-cover w-full h-full"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://placehold.co/400?text=Error';
                                    }}
                                />

                                {field.isPrimary && (
                                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-medium shadow-sm">
                                        Primary
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setPrimary(index)}
                                        title="Set as Primary"
                                    >
                                        <Star className={`h-4 w-4 ${field.isPrimary ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => remove(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
            {fields.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm border rounded-lg bg-muted/10">
                    No images added yet.
                </div>
            )}
        </div>
    );
}
