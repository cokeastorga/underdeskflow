"use client";

import Link from "next/link";
import Image from "next/image";
import { Shirt, Watch, Home, Smartphone, Footprints, Glasses } from "lucide-react";

interface Category {
    id: string;
    name: string;
    icon?: any;
    image: string;
    slug: string;
}

const DEFAULT_CATEGORIES: Category[] = [
    {
        id: "1",
        name: "Moda Mujer",
        icon: Shirt,
        image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=2071&auto=format&fit=crop",
        slug: "women",
    },
    {
        id: "2",
        name: "Moda Hombre",
        icon: Shirt,
        image: "https://images.unsplash.com/photo-1488161628813-99c974c5c28e?q=80&w=2069&auto=format&fit=crop",
        slug: "men",
    },
    {
        id: "3",
        name: "Tecnología",
        icon: Smartphone,
        image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=2101&auto=format&fit=crop",
        slug: "electronics",
    },
    {
        id: "4",
        name: "Hogar",
        icon: Home,
        image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?q=80&w=2070&auto=format&fit=crop",
        slug: "home",
    },
    {
        id: "5",
        name: "Zapatos",
        icon: Footprints,
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop",
        slug: "shoes",
    },
    {
        id: "6",
        name: "Accesorios",
        icon: Glasses,
        image: "https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?q=80&w=2000&auto=format&fit=crop",
        slug: "accessories",
    },
];

import { MotionWrapper, staggerContainer, staggerItem } from "@/components/ui/motion-wrapper";
import { motion } from "framer-motion";

export function CategoryNav({ storeId, categories = [], template = "modern" }: { storeId: string; categories?: Category[]; template?: "modern" | "minimal" | "bold" }) {
    const activeCategories = categories;

    if (activeCategories.length === 0) {
        return null;
    }

    const styles = {
        modern: {
            title: "text-4xl md:text-5xl font-bold mb-12 font-serif text-center",
            grid: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8",
            card: "group flex flex-col items-center justify-center gap-6 p-8 bg-white rounded-[2rem] shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-50",
            imageContainer: "relative w-32 h-32 rounded-full overflow-hidden shadow-inner group-hover:scale-110 transition-all duration-700",
            text: "font-bold text-gray-900 group-hover:text-primary transition-colors text-lg tracking-tight"
        },
        minimal: {
            title: "text-3xl md:text-4xl font-light mb-16 text-center uppercase tracking-[0.3em]",
            grid: "grid grid-cols-2 md:grid-cols-6 gap-10",
            card: "group flex flex-col items-center gap-4",
            imageContainer: "relative w-full aspect-square rounded-full overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-1000 ease-out border border-transparent group-hover:border-black/10",
            text: "text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-gray-400 group-hover:text-black mt-4 transition-all"
        },
        bold: {
            title: "text-5xl md:text-7xl font-black mb-16 border-b-8 border-black inline-block uppercase italic transform -rotate-1 tracking-tighter",
            grid: "grid grid-cols-2 lg:grid-cols-6 gap-6",
            card: "group relative flex flex-col items-center justify-center p-8 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all",
            imageContainer: "relative w-24 h-24 mb-4 rounded-none bg-primary border-4 border-black overflow-hidden",
            text: "text-sm font-black uppercase tracking-tighter bg-black text-white px-4 py-2 transform -skew-x-12 group-hover:skew-x-0 transition-transform"
        }
    };

    const currentStyle = styles[template] || styles.modern;

    return (
        <section className={`py-24 md:py-32 ${template === 'modern' ? 'bg-gray-50/50' : 'bg-white'}`}>
            <div className="container mx-auto px-4">
                <MotionWrapper direction="up" className={template === 'bold' ? 'text-left' : 'text-center'}>
                    <h2 className={currentStyle.title}>Explorar Categorías</h2>
                </MotionWrapper>

                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className={currentStyle.grid}
                >
                    {activeCategories.map((cat) => (
                        <motion.div key={cat.id} variants={staggerItem}>
                            <Link
                                href={`/${storeId}/products?category=${cat.slug}`}
                                className={currentStyle.card}
                            >
                                <div className={currentStyle.imageContainer}>
                                    <Image
                                        src={cat.image || "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=2070&auto=format&fit=crop"}
                                        alt={cat.name}
                                        fill
                                        className={`object-cover ${template === 'bold' ? 'mix-blend-multiply' : ''}`}
                                    />
                                </div>
                                <span className={currentStyle.text}>
                                    {cat.name}
                                </span>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
