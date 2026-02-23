import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, CheckCircle2 } from "lucide-react";

interface ContextHelperProps {
    currentStep: number;
}

const TIPS = [
    {
        title: "Información Clave",
        content: "El título debe ser descriptivo (incluye marca, modelo, característica principal). Una buena categoría mejora los filtros y la navegación de tu tienda.",
        checklist: [
            "Título claro y descriptivo",
            "Categoría seleccionada",
            "Descripción completa (mín. 50 palabras)",
            "Marca / Vendedor completado",
        ],
    },
    {
        title: "Imágenes que Venden",
        content: "Usa imágenes de alta calidad (mínimo 1000×1000 px). Muestra el producto desde varios ángulos. La primera imagen será la portada en el catálogo.",
        checklist: [
            "Al menos 1 imagen cargada",
            "Imagen principal con fondo limpio (blanco recomendado)",
            "Imágenes desde diferentes ángulos",
        ],
    },
    {
        title: "Estrategia de Precios",
        content: "El 'Precio de Comparación' aparecerá tachado (útil para mostrar descuentos). El SKU es fundamental para una gestión logística seria. Activa 'Seguimiento de Stock' para no sobrevender.",
        checklist: [
            "Precio de venta definido",
            "Precio de costo ingresado (para márgenes)",
            "SKU único asignado",
            "Stock inicial configurado",
        ],
    },
    {
        title: "Variantes de Producto",
        content: "Úsalo si vendes el mismo producto en diferentes tallas, colores o porciones. Cada variante tendrá su propio stock, precio y SKU. Recuerda hacer clic en 'Generar Variantes' después de configurar las opciones.",
        checklist: [
            "Opciones definidas (Talla, Color, etc.)",
            "Valores agregados a cada opción",
            "Clic en 'Generar Variantes'",
            "Precio/Stock editado por variante",
        ],
    },
    {
        title: "Dimensiones y Ficha Técnica",
        content: "El peso y las dimensiones son usados en el cálculo de envíos. Las especificaciones técnicas (material, potencia, etc.) mejoran la ficha de producto y el SEO.",
        checklist: [
            "Peso del producto (en kg)",
            "Dimensiones de envío (largo × ancho × alto)",
            "Especificaciones técnicas relevantes",
        ],
    },
    {
        title: "SEO y Visibilidad",
        content: "El slug se genera automáticamente desde el título. El título SEO y la meta descripción aparecen en Google: usa palabras clave que tus clientes buscarían. El estado 'Borrador' permite guardar sin publicar.",
        checklist: [
            "Estado seleccionado (Activo/Borrador)",
            "Etiquetas añadidas",
            "Slug URL revisado",
            "Título SEO optimizado (máx. 60 caracteres)",
            "Meta descripción (máx. 160 caracteres)",
        ],
    },
];

export function ContextHelper({ currentStep }: ContextHelperProps) {
    const tip = TIPS[currentStep] || TIPS[0];

    return (
        <div className="space-y-4">
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-700 dark:text-blue-400">
                        <Lightbulb className="h-4 w-4" />
                        Consejo Pro
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-blue-900 dark:text-blue-200">
                    {tip.content}
                </CardContent>
            </Card>

            <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Checklist para este paso
                </p>
                <ul className="space-y-2">
                    {tip.checklist.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-muted-foreground/50" />
                            {item}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
