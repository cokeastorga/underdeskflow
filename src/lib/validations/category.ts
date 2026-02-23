import { z } from "zod";

export const CategorySchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    slug: z.string()
        .min(1, "El slug es requerido")
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "El slug debe contener solo minúsculas, números y guiones"),
    description: z.string().optional(),
    image: z.string().url("URL inválida").optional().or(z.literal("")),
    parentId: z.string().optional(),
    isActive: z.boolean().default(true),
    sortOrder: z.coerce.number().int().default(0),
});

export type CategoryFormValues = z.infer<typeof CategorySchema>;
