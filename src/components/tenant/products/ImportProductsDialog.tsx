"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileUp, AlertCircle, CheckCircle2, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { collection, writeBatch, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/auth-context";

interface ParsedProduct {
    name: string;
    price: number;
    stock: number;
    category: string;
    description: string;
    image: string;
    images: string[];
    brand: string;
    model: string;
    origin: string;
    warranty: string;
    careInstructions: string;
    weight: number;
    isValid: boolean;
    errors: string[];
}

export function ImportProductsDialog({ onImportSuccess }: { onImportSuccess: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload');
    const [parsedData, setParsedData] = useState<ParsedProduct[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { storeId } = useAuth();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            parseCSV(selectedFile);
        }
    };

    const parseCSV = (file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            // Split by newline, handle CR LF
            const lines = text.split(/\r\n|\n/);

            // Expected: Name, Price, Stock, Category, Description, Image, Images (separated by ;), Brand, Model, Origin, Warranty, Care, Weight

            const products: ParsedProduct[] = [];

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                // Handle simple CSV splitting (doesn't handle commas inside quotes efficiently but works for simple case)
                const values = line.split(',').map(v => v.trim());

                // Mapping indices (assuming strict template order)
                // 0:Name, 1:Price, 2:Stock, 3:Category, 4:Description, 5:Image, 6:Images, 7:Brand, 8:Model, 9:Origin, 10:Warranty, 11:Care, 12:Weight
                const name = values[0] || "";
                const priceString = values[1] || "0";
                const stockString = values[2] || "0";
                const category = values[3] || "General";
                const description = values[4] || "";
                const image = values[5] || "";
                const imagesStr = values[6] || "";
                const brand = values[7] || "";
                const model = values[8] || "";
                const origin = values[9] || "";
                const warranty = values[10] || "";
                const careInstructions = values[11] || "";
                const weightStr = values[12] || "0";

                const price = parseFloat(priceString.replace(/[^0-9.]/g, ''));
                const stock = parseInt(stockString.replace(/[^0-9]/g, ''));
                const weight = parseFloat(weightStr.replace(/[^0-9.]/g, ''));

                const errors: string[] = [];
                if (!name) errors.push("Falta nombre");
                if (isNaN(price)) errors.push("Precio inválido");

                // Process images
                const additionalImages = imagesStr ? imagesStr.split(';').map(url => url.trim()).filter(url => url) : [];
                // If main image is provided, add it to the list if not already there
                const allImages = image ? [image, ...additionalImages] : additionalImages;
                // De-duplicate
                const uniqueImages = [...new Set(allImages)];

                products.push({
                    name,
                    price: isNaN(price) ? 0 : price,
                    stock: isNaN(stock) ? 0 : stock,
                    category,
                    description,
                    image,
                    images: uniqueImages,
                    brand,
                    model,
                    origin,
                    warranty,
                    careInstructions,
                    weight: isNaN(weight) ? 0 : weight,
                    isValid: errors.length === 0,
                    errors
                });
            }

            setParsedData(products);
            setStep('preview');
        };
        reader.readAsText(file);
    };

    const handleImport = async () => {
        if (!storeId || parsedData.length === 0) return;
        setStep('importing');

        try {
            const batch = writeBatch(db);
            const collectionRef = collection(db, "products");

            // Process only valid products
            const validProducts = parsedData.filter(p => p.isValid);

            if (validProducts.length === 0) {
                toast.error("No hay productos válidos para importar");
                setStep('preview');
                return;
            }

            validProducts.forEach(product => {
                const newDocRef = doc(collectionRef);
                // Create media array for the new schema
                const mediaItems = product.images.map((url, index) => ({
                    id: crypto.randomUUID(),
                    url,
                    type: "image" as const,
                    isPrimary: index === 0,
                    order: index
                }));

                batch.set(newDocRef, {
                    storeId,
                    name: product.name,
                    title: product.name, // Support both fields
                    description: product.description,
                    price: product.price,
                    stock: product.stock,
                    category: product.category,
                    image: product.image, // Main image for legacy/simple view
                    images: product.images, // Array of strings for simple view
                    media: mediaItems, // New Media Schema

                    // Luxury Fields
                    brand: product.brand,
                    model: product.model,
                    origin: product.origin,
                    warranty: product.warranty,
                    careInstructions: product.careInstructions,
                    weight: product.weight,

                    isActive: true,
                    status: 'active',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    hasVariants: false
                });
            });

            await batch.commit();

            toast.success(`${validProducts.length} productos importados correctamente`);
            setIsOpen(false);
            setStep('upload');
            setFile(null);
            setParsedData([]);
            onImportSuccess();

        } catch (error) {
            console.error("Error importing products:", error);
            toast.error("Error al importar productos");
            setStep('preview');
        }
    };

    const downloadTemplate = () => {
        const headers = "Nombre,Precio,Stock,Categoría,Descripción,URL Imagen,Otras Imágenes (separadas por ;),Marca,Modelo,Origen,Garantía,Cuidados,Peso (kg)";
        const example = "Camiseta Lujo,29990,50,Ropa,Seda 100%,https://ejemplo.com/img.jpg,https://ejemplo.com/2.jpg;https://ejemplo.com/3.jpg,Gucci,Summer 2024,Italia,1 Año,Lavado en Seco,0.2";
        const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + example;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "plantilla_productos_lujo.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" /> Importar CSV
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>Importación Masiva de Productos</DialogTitle>
                    <DialogDescription>
                        Carga un archivo CSV para agregar múltiples productos a la vez.
                    </DialogDescription>
                </DialogHeader>

                {step === 'upload' && (
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg space-y-4">
                        <div className="p-4 bg-primary/10 rounded-full">
                            <FileUp className="h-8 w-8 text-primary" />
                        </div>
                        <div className="text-center">
                            <p className="font-medium">Arrastra tu archivo CSV aquí o haz clic para buscar</p>
                            <p className="text-sm text-muted-foreground mt-1">Máximo 100 productos por carga</p>
                        </div>
                        <input
                            type="file"
                            accept=".csv"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                        <div className="flex gap-2">
                            <Button onClick={() => fileInputRef.current?.click()}>
                                Seleccionar Archivo
                            </Button>
                            <Button variant="outline" onClick={downloadTemplate}>
                                <Download className="mr-2 h-4 w-4" /> Descargar Plantilla
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'preview' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium">Vista Previa ({parsedData.length} productos detectados)</h3>
                            <Button variant="ghost" size="sm" onClick={() => { setStep('upload'); setFile(null); }}>
                                Cargar otro archivo
                            </Button>
                        </div>
                        <div className="border rounded-md max-h-[300px] overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Estado</TableHead>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>Precio</TableHead>
                                        <TableHead>Stock</TableHead>
                                        <TableHead>Categoría</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {parsedData.map((row, idx) => (
                                        <TableRow key={idx} className={!row.isValid ? "bg-red-50" : ""}>
                                            <TableCell>
                                                {row.isValid ? (
                                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <div className="flex items-center gap-1 text-red-500" title={row.errors.join(", ")}>
                                                        <AlertCircle className="h-4 w-4" />
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">{row.name || "-"}</TableCell>
                                            <TableCell>${row.price}</TableCell>
                                            <TableCell>{row.stock}</TableCell>
                                            <TableCell>{row.category}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex items-center gap-2 p-4 bg-yellow-50 text-yellow-800 rounded-md text-sm">
                            <AlertCircle className="h-4 w-4" />
                            <p>Se importarán <strong>{parsedData.filter(p => p.isValid).length}</strong> productos válidos en el orden mostrado.</p>
                        </div>
                    </div>
                )}

                {step === 'importing' && (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Procesando productos...</p>
                    </div>
                )}

                <DialogFooter>
                    {step === 'preview' && (
                        <>
                            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                            <Button onClick={handleImport} disabled={parsedData.filter(p => p.isValid).length === 0}>
                                Importar {parsedData.filter(p => p.isValid).length} Productos
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
