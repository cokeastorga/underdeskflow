"use client";

import React from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { CarouselSlide } from "@/types";

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
    const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 6000 })]);
    const activeSlides = slides && slides.length > 0 ? slides : DEFAULT_SLIDES;

    // Luxury Styles Configuration
    const styles = {
        modern: {
            wrapper: "h-[80vh] min-h-[600px]",
            imageAnimation: "animate-slow-zoom",
            overlay: "bg-gradient-to-t from-black/80 via-black/20 to-black/30",
            contentContainer: "flex flex-col items-center justify-center text-center p-8 max-w-5xl mx-auto px-4",
            title: "text-4xl md:text-7xl lg:text-8xl font-bold font-serif tracking-tight text-white drop-shadow-xl",
            subtitle: "text-sm md:text-2xl font-light tracking-[0.2em] uppercase text-white/90 mb-6",
            button: "bg-white text-black hover:bg-white/90 rounded-full px-8 py-3 md:px-10 md:py-4 text-sm md:text-base font-semibold tracking-widest uppercase transition-all hover:scale-105 hover:shadow-lg"
        },
        minimal: {
            wrapper: "h-[70vh] min-h-[500px]",
            imageAnimation: "",
            overlay: "bg-black/10",
            contentContainer: "flex flex-col items-start justify-center text-left p-8 md:p-24 max-w-7xl mx-auto h-full px-6",
            title: "text-4xl md:text-7xl font-light tracking-tighter text-white mix-blend-difference leading-tight",
            subtitle: "text-xs md:text-sm font-bold tracking-[0.3em] uppercase text-white mb-4 border-l-2 border-white pl-4",
            button: "bg-transparent border border-white text-white hover:bg-white hover:text-black rounded-none px-6 py-2 md:px-8 md:py-3 text-xs font-bold uppercase tracking-widest transition-all backdrop-blur-sm"
        },
        bold: {
            wrapper: "h-[85vh] min-h-[600px]",
            imageAnimation: "grayscale hover:grayscale-0 transition-all duration-700",
            overlay: "bg-black/40",
            contentContainer: "flex flex-col items-center justify-center text-center p-4 max-w-full mx-auto relative z-10 px-4",
            title: "text-5xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter text-transparent stroke-white stroke-2 bg-clip-text bg-gradient-to-b from-white to-white/50 leading-none",
            subtitle: "text-lg md:text-3xl font-black bg-primary text-primary-foreground px-4 py-2 transform -skew-x-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
            button: "mt-8 bg-primary text-primary-foreground hover:bg-primary/90 rounded-none px-8 py-4 md:px-12 md:py-5 text-lg md:text-xl font-black uppercase border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-2 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
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
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-forwards">
                                    {template === 'minimal' && (
                                        <p className={currentStyle.subtitle}>
                                            {slide.subtitle}
                                        </p>
                                    )}

                                    <h1 className={currentStyle.title}>
                                        {slide.title}
                                    </h1>

                                    {template !== 'minimal' && (
                                        <p className={currentStyle.subtitle}>
                                            {slide.subtitle}
                                        </p>
                                    )}

                                    <div className="pt-4">
                                        <Link href={slide.ctaLink.startsWith("/") ? `/${storeId}${slide.ctaLink}` : slide.ctaLink}>
                                            <Button className={currentStyle.button}>
                                                {slide.ctaText}
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Custom Navigation (Optional, can add later) */}
        </section>
    );
}
