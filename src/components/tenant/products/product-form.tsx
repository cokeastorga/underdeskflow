import { useState, useEffect } from "react";
import { Loader2, Save, ArrowLeft, History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useProductFormLogic } from "@/hooks/useProductFormLogic";
import { AdminProduct } from "@/types/admin";
import { useAuth } from "@/lib/firebase/auth-context";
import { ProductAuditLog } from "./ProductAuditLog";

// Sections
import { GeneralSection } from "./form-sections/general-section";
import { PricingSection } from "./form-sections/pricing-section";
import { InventorySection } from "./form-sections/inventory-section";
import { VariantsSection } from "./form-sections/VariantsSection";
import { MediaSection } from "./form-sections/media-section";
import { SeoSection } from "./form-sections/seo-section";
import { OrganizationSection } from "./form-sections/organization-section";

interface ProductFormProps {
    initialData?: AdminProduct | null;
}

export function ProductForm({ initialData }: ProductFormProps) {
    const { form, onSubmit, loading, router, isEditMode } = useProductFormLogic({ initialData }) as any;
    const { storeId, user } = useAuth();
    const [token, setToken] = useState("");

    useEffect(() => {
        if (user) {
            user.getIdToken().then(setToken);
        }
    }, [user]);

    return (
        <Form {...form}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <form onSubmit={form.handleSubmit(onSubmit as any, (errors: any) => console.error("Validation Errors:", errors))} className="space-y-8 pb-20">

                {/* Header Actions - Desktop */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => router.back()} type="button">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                {isEditMode ? "Editar Producto" : "Nuevo Producto"}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {isEditMode ? `Editando: ${initialData?.title}` : "Agrega un nuevo producto a tu tienda"}
                            </p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-2">
                        <Button variant="outline" type="button" onClick={() => router.back()}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Producto
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="details" className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="details">Detalles del Producto</TabsTrigger>
                        {isEditMode && (
                            <TabsTrigger value="history" className="gap-2">
                                <History className="h-4 w-4" />
                                Historial de Cambios
                            </TabsTrigger>
                        )}
                    </TabsList>

                    <TabsContent value="details" className="space-y-8 border-none p-0 outline-none">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Main Column */}
                            <div className="lg:col-span-2 space-y-8">
                                <Card>
                                    <CardContent className="p-6 space-y-6">
                                        <GeneralSection form={form as any} />
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-6 space-y-6">
                                        <MediaSection form={form as any} />
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Precios e Inventario</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-6">
                                        <PricingSection form={form as any} />
                                        <Separator />
                                        <InventorySection form={form as any} />
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Variantes</CardTitle>
                                        <CardDescription>
                                            Agrega opciones como talla o color.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <VariantsSection form={form as any} />
                                    </CardContent>
                                </Card>

                                <div className="block md:hidden">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Organización</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6 space-y-6">
                                            <OrganizationSection form={form as any} />
                                        </CardContent>
                                    </Card>
                                </div>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>SEO</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <SeoSection form={form as any} />
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Sidebar Column - Desktop Only */}
                            <div className="hidden lg:block space-y-8">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Estado</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <FormField
                                            control={form.control as any}
                                            name="status"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Estado del Producto</FormLabel>
                                                    <FormControl>
                                                        <select
                                                            className="w-full p-2 border rounded-md"
                                                            {...field}
                                                        >
                                                            <option value="active">Activo</option>
                                                            <option value="draft">Borrador</option>
                                                            <option value="archived">Archivado</option>
                                                        </select>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Organización</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-6">
                                        <OrganizationSection form={form as any} />
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {isEditMode && initialData && storeId && (
                        <TabsContent value="history" className="border-none p-0 outline-none">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Historial de Auditoría</CardTitle>
                                    <CardDescription>
                                        Rastreo completo de cambios manuales y sincronizaciones automáticas entre canales.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <ProductAuditLog
                                        productId={initialData.id!}
                                        storeId={storeId}
                                        token={token}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}
                </Tabs>

                {/* Mobile Sticky Action Bar */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 md:hidden z-50 flex items-center gap-4">
                    <div className="flex-1">
                        <FormField
                            control={form.control as any}
                            name="status"
                            render={({ field }) => (
                                <select
                                    className="w-full p-2 border rounded-md text-sm"
                                    {...field}
                                >
                                    <option value="active">Activo</option>
                                    <option value="draft">Borrador</option>
                                    <option value="archived">Archivado</option>
                                </select>
                            )}
                        />
                    </div>
                    <Button type="submit" disabled={loading} className="flex-1">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Guardar
                    </Button>
                </div>

            </form>
        </Form>
    );
}
