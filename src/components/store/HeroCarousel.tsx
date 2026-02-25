"use client";

import React from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { CarouselSlide } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT_SLIDES: CarouselSlide[] = [
    {
        id: "1",
        title: "Nueva Colección 2026",
        subtitle: "Descubre las últimas tendencias en moda urbana.",
        image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop",
        ctaText: "Ver Colección",
        ctaLink: "/products?category=new",
    },
    {
        id: "2",
        title: "Tecnología de Punta",
        subtitle: "Equipa tu vida con lo último en gadgets.",
        image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070&auto=format&fit=crop",
        ctaText: "Comprar Tecno",
        ctaLink: "/products?category=electronics",
    },
    {
        id: "3",
        title: "Hogar & Diseño",
        subtitle: "Renueva tus espacios con estilo.",
        image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4f9d?q=80&w=2070&auto=format&fit=crop",
        ctaText: "Ver Hogar",
        ctaLink: "/products?category=home",
    },
];

export function HeroCarousel({ storeId, slides = [], template = "modern" }: { storeId: string; slides?: CarouselSlide[]; template?: "modern" | "minimal" | "bold" }) {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 6000, stopOnInteraction: false })]);

    // If no slides, show a branded placeholder instead of demo fallback
    const activeSlides = slides && slides.length > 0 ? slides : [
        {
            id: "placeholder",
            title: "Bienvenidos",
            subtitle: "Explora nuestro catálogo exclusivo.",
            image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop",
            ctaText: "Ver Productos",
            ctaLink: "/products",
        }
    ];

    // Luxury Styles Configuration
    const styles = {
        modern: {
            wrapper: "h-[85vh] min-h-[700px]",
            imageAnimation: "animate-slow-zoom",
            overlay: "bg-gradient-to-t from-black/90 via-black/20 to-black/40",
            contentContainer: "flex flex-col items-center justify-center text-center p-8 max-w-6xl mx-auto px-4",
            title: "text-5xl md:text-8xl lg:text-9xl font-bold font-serif tracking-tighter text-white drop-shadow-2xl leading-[0.9]",
            subtitle: "text-xs md:text-xl font-medium tracking-[0.4em] uppercase text-white/80 mb-8",
            button: "bg-white text-black hover:bg-black hover:text-white rounded-full px-10 py-4 md:px-14 md:py-6 text-xs md:text-sm font-bold tracking-[0.2em] uppercase transition-all duration-500 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
        },
        minimal: {
            wrapper: "h-[75vh] min-h-[600px]",
            imageAnimation: "grayscale hover:grayscale-0 transition-all duration-1000",
            overlay: "bg-black/5",
            contentContainer: "flex flex-col items-start justify-center text-left p-8 md:p-32 max-w-7xl mx-auto h-full px-6",
            title: "text-5xl md:text-8xl font-light tracking-tighter text-white mix-blend-difference leading-none",
            subtitle: "text-[10px] md:text-xs font-black tracking-[0.5em] uppercase text-white mb-6 border-l-4 border-white pl-6",
            button: "bg-transparent border-2 border-white text-white hover:bg-white hover:text-black rounded-none px-8 py-3 md:px-12 md:py-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all backdrop-blur-md"
        },
        bold: {
            wrapper: "h-[90vh] min-h-[750px]",
            imageAnimation: "contrast-125 brightness-75",
            overlay: "bg-black/30",
            contentContainer: "flex flex-col items-center justify-center text-center p-4 max-w-full mx-auto relative z-10 px-4",
            title: "text-6xl md:text-[10rem] lg:text-[12rem] font-black uppercase tracking-tighter text-white leading-none drop-shadow-[10px_10px_0px_rgba(0,0,0,1)]",
            subtitle: "text-xl md:text-4xl font-black bg-yellow-400 text-black px-6 py-3 transform -rotate-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-12",
            button: "bg-black text-white hover:bg-yellow-400 hover:text-black rounded-none px-12 py-6 md:px-20 md:py-8 text-xl md:text-2xl font-black uppercase border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all"
        }
    };

    const currentStyle = styles[template] || styles.modern;

    return (
        <section className={`relative overflow-hidden bg-black group ${template === 'modern' ? 'font-serif' : 'font-sans'}`} ref={emblaRef}>
            <div className={`flex touch-pan-y ${currentStyle.wrapper}`}>
                {activeSlides.map((slide, index) => (
                    <div key={slide.id} className="relative min-w-full flex-[0_0_100%] h-full overflow-hidden">
                        {/* Image with Parallax/Zoom Effect */}
                        <div className={`absolute inset-0 w-full h-full transition-transform duration-[10000ms] ease-linear scale-110 group-hover:scale-100 ${currentStyle.imageAnimation}`}>
                            <Image
                                src={slide.image}
                                alt={slide.title}
                                fill
                                className="object-cover"
                                priority={index === 0}
                                sizes="100vw"
                            />
                        </div>

                        {/* Overlay */}
                        <div className={`absolute inset-0 ${currentStyle.overlay}`} />

                        {/* Content */}
                        <div className="absolute inset-0 flex flex-col h-full w-full">
                            <div className={`flex-1 ${currentStyle.contentContainer}`}>
                                <motion.div
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 1, ease: "circOut", delay: 0.2 }}
                                    className="space-y-8 group/content"
                                >
                                    {template === 'minimal' && (
                                        <motion.p
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.8, delay: 0.5 }}
                                            className={currentStyle.subtitle}
                                        >
                                            {slide.subtitle}
                                        </motion.p>
                                    )}

                                    <motion.h1
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 1, delay: 0.3 }}
                                        className={currentStyle.title}
                                    >
                                        {slide.title}
                                    </motion.h1>

                                    {template !== 'minimal' && (
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            whileInView={{ opacity: 1 }}
                                            transition={{ duration: 0.8, delay: 0.6 }}
                                            className={currentStyle.subtitle}
                                        >
                                            {slide.subtitle}
                                        </motion.p>
                                    )}

                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 0.8 }}
                                        className="pt-6"
                                    >
                                        <Link href={slide.ctaLink.startsWith("/") ? `/${storeId}${slide.ctaLink}` : slide.ctaLink}>
                                            <Button className={currentStyle.button}>
                                                {slide.ctaText}
                                            </Button>
                                        </Link>
                                    </motion.div>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Custom Navigation (Optional, can add later) */}
        </section>
    );
}
