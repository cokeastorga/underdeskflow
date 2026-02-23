import { z } from "zod";

export const ProductStatusSchema = z.enum(["active", "draft", "archived"]);

export const ProductOptionSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "El nombre de la opción es requerido"),
    values: z.array(z.string()).min(1, "Debe haber al menos un valor para la opción"),
});

export const ProductMediaSchema = z.object({
    id: z.string(),
    url: z.string().url("URL inválida"),
    type: z.enum(["image", "video"]),
    isPrimary: z.boolean(),
    order: z.number(),
});

// Base schema for shared inventory/price fields
const ProductInventorySchema = z.object({
    price: z.coerce.number().min(0, "El precio no puede ser negativo"),
    compareAtPrice: z.coerce.number().min(0).optional(),
    costPrice: z.coerce.number().min(0).optional(),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    stock: z.coerce.number().int().min(0),
    trackStock: z.boolean().default(false),
    allowBackorder: z.boolean().default(false),
    lowStockThreshold: z.coerce.number().int().min(0).optional(),
    weight: z.coerce.number().min(0).optional(),
});

export const ProductVariantSchema = ProductInventorySchema.extend({
    id: z.string(),
    title: z.string(),
    options: z.record(z.string(), z.string()), // { "Color": "Red", "Size": "Small" }
    status: z.enum(["active", "out_of_stock", "archived"]),
    image: z.union([z.literal(""), z.string().url()]).optional(),
});

export const ProductSchema = ProductInventorySchema.extend({
    title: z.string().min(1, "El título es requerido"),
    slug: z.string()
        .min(1, "El slug es requerido")
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "El slug debe contener solo minúsculas, números y guiones"),
    description: z.string().optional(),
    status: ProductStatusSchema,

    vendor: z.string().optional(),
    category: z.string().optional(),
    brand: z.string().optional(),
    model: z.string().optional(),
    origin: z.string().optional(),
    warranty: z.string().optional(),
    careInstructions: z.string().optional(),

    dimensions: z.object({
        length: z.coerce.number().min(0).default(0),
        width: z.coerce.number().min(0).default(0),
        height: z.coerce.number().min(0).default(0),
    }).optional(),

    technicalSpecs: z.array(z.object({
        label: z.string().min(1, "Label required"),
        value: z.string().min(1, "Value required")
    })).default([]),

    tags: z.array(z.string()).default([]),

    media: z.array(ProductMediaSchema).default([]),

    hasVariants: z.boolean().default(false),
    options: z.array(ProductOptionSchema).default([]),
    variants: z.array(ProductVariantSchema).default([]),

    seo: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
    }).optional(),
}).superRefine((data, ctx) => {
    // 1. Validation for Low Stock Threshold
    if (data.lowStockThreshold !== undefined && data.lowStockThreshold < 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "El umbral debe ser mayor o igual a 0",
            path: ["lowStockThreshold"],
        });
    }

    // 2. If hasVariants is false, Price is required on base.
    if (!data.hasVariants) {
        if (data.price === undefined || data.price === null) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "El precio es requerido para productos sin variantes",
                path: ["price"],
            });
        }
    }

    // 3. If hasVariants is true, we must ensure at least one variant exists if options are defined
    if (data.hasVariants && data.variants.length === 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Debes agregar al menos una variante",
            path: ["variants"],
        });
    }
});

export type ProductFormValues = z.infer<typeof ProductSchema>;
