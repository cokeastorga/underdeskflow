"use client";

import { useState, useMemo } from "react";
import {
    Search,
    Truck,
    RotateCcw,
    ShieldCheck,
    ChevronRight,
    LifeBuoy,
    Info,
    PhoneCall,
    Package,
    ArrowRight,
    MessageCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from "@/components/ui/accordion";
import { HelpItem } from "@/components/store/HelpItem";
import { Store } from "@/types/store";
import Link from "next/link";

interface HelpCenterClientProps {
    store: Store;
}

export function HelpCenterClient({ store }: HelpCenterClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [orderId, setOrderId] = useState("");
    const [isTracking, setIsTracking] = useState(false);

    const primaryColor = store.design?.colors?.primary || "#000000";
    const storeEmail = store.contactEmail || "soporte@tu-tienda.com";
    const storePhone = store.socialLinks?.whatsapp || store.phoneNumber || "+56 9 1234 5678";

    // Use dynamic categories from store config or fallback to defaults
    const categories = useMemo(() => {
        if (store.helpCenter?.categories && store.helpCenter.categories.length > 0) {
            return store.helpCenter.categories.map(cat => ({
                ...cat,
                icon: cat.icon === 'Truck' ? Truck :
                    cat.icon === 'RotateCcw' ? RotateCcw :
                        cat.icon === 'PhoneCall' ? PhoneCall : ShieldCheck,
                color: "text-primary",
                bg: "bg-primary/10",
            }));
        }

        return [
            {
                title: "Compras y Envíos",
                description: "Información sobre plazos de entrega, costos y cobertura de despacho.",
                icon: Truck,
                color: "text-blue-500",
                bg: "bg-blue-500/10",
                links: ["Plazos de entrega", "Seguimiento de mi pedido", "Costos de envío por región"]
            },
            {
                title: "Garantías y Devoluciones",
                description: "Conoce tus derechos como consumidor y cómo solicitar un cambio.",
                icon: RotateCcw,
                color: "text-purple-500",
                bg: "bg-purple-500/10",
                links: ["Derecho a Retracto (10 días)", "Garantía Legal (6 meses)", "Cómo iniciar una devolución"]
            },
            {
                title: "Soporte Directo",
                description: "Canales oficiales para contactar directamente con la tienda.",
                icon: PhoneCall,
                color: "text-green-500",
                bg: "bg-green-500/10",
                links: ["Formulario de contacto", "WhatsApp de soporte", "Horarios de atención"]
            },
            {
                title: "Legal y Privacidad",
                description: "Políticas de uso de datos y términos de servicio.",
                icon: ShieldCheck,
                color: "text-orange-500",
                bg: "bg-orange-500/10",
                links: ["Términos de servicio", "Política de privacidad", "Responsabilidad de la plataforma"]
            }
        ];
    }, [store.helpCenter?.categories]);

    // Use dynamic FAQs from store config or fallback to defaults
    const faqs = useMemo(() => {
        if (store.helpCenter?.faqs && store.helpCenter.faqs.length > 0) {
            return store.helpCenter.faqs.map(f => ({ q: f.question, a: f.answer }));
        }

        return [
            {
                q: "¿Cuál es el plazo de entrega?",
                a: "Los despachos suelen tardar entre 2 a 5 días hábiles dependiendo de la región. Una vez realizada la compra, recibirás un correo con el número de seguimiento."
            },
            {
                q: "¿Cómo ejerzo mi derecho a retracto?",
                a: "De acuerdo a la Ley 19.496, cuentas con un plazo de 10 días desde que recibes el producto para solicitar el retracto de la compra. El producto debe estar sin uso y sellado."
            },
            {
                q: "¿Qué hago si mi producto llega fallado?",
                a: "Todos los productos nuevos cuentan con una garantía legal de 6 meses. Puedes optar por el cambio, reparación o devolución si presenta fallas de fábrica."
            }
        ];
    }, [store.helpCenter?.faqs]);

    const filteredCategories = useMemo(() => {
        if (!searchQuery) return categories;
        const query = searchQuery.toLowerCase();
        return categories.filter(cat =>
            cat.title.toLowerCase().includes(query) ||
            cat.description.toLowerCase().includes(query) ||
            cat.links.some(link => link.toLowerCase().includes(query))
        );
    }, [searchQuery]);

    const handleTrackOrder = (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderId) return;
        setIsTracking(true);
        // Simulate tracking lookup
        setTimeout(() => setIsTracking(false), 1500);
    };

    const whatsappNumber = storePhone.replace(/\D/g, "");

    return (
        <div className="relative">
            {/* Hero Section with Search */}
            <section className="bg-white dark:bg-zinc-900 py-20 relative overflow-hidden border-b border-zinc-200 dark:border-zinc-800">
                <div className="container relative z-10 mx-auto px-4 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-6">
                        <LifeBuoy className="w-3 h-3" /> Centro de Soporte v2.0
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">¿Cómo podemos ayudarte hoy?</h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto mb-12 text-lg">
                        Busca en nuestras guías o rasta tu pedido de {store.name}.
                    </p>

                    <div className="max-w-2xl mx-auto relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar en el Centro de Ayuda (ej: devoluciones, envíos...)"
                            className="w-full pl-12 h-16 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder:text-zinc-500 rounded-2xl focus-visible:ring-primary text-lg transition-all"
                        />
                    </div>
                </div>
            </section>

            {/* Order Tracking Tool */}
            <section className="py-12 bg-zinc-100 dark:bg-zinc-950/50">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-1 space-y-4 text-center md:text-left">
                            <h3 className="text-2xl font-bold flex items-center justify-center md:justify-start gap-3">
                                <Package className="w-6 h-6 text-primary" />
                                Rastrear Pedido
                            </h3>
                            <p className="text-muted-foreground text-sm">
                                Ingresa tu número de orden para ver el estado de tu despacho en tiempo real.
                            </p>
                        </div>
                        <form onSubmit={handleTrackOrder} className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
                            <Input
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value)}
                                placeholder="Ej: #123456"
                                className="h-12 w-full sm:w-48 bg-zinc-50 dark:bg-zinc-800 rounded-xl"
                            />
                            <Button
                                type="submit"
                                disabled={isTracking}
                                className="h-12 px-8 rounded-xl font-bold gap-2"
                                style={{ backgroundColor: primaryColor }}
                            >
                                {isTracking ? "Buscando..." : "Consultar"}
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </form>
                    </div>
                </div>
            </section>

            {/* Categories Grid */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    {filteredCategories.length === 0 ? (
                        <div className="text-center py-20 space-y-4">
                            <Search className="w-12 h-12 text-zinc-300 mx-auto" />
                            <h3 className="text-xl font-bold text-zinc-500">No encontramos resultados para "{searchQuery}"</h3>
                            <Button variant="ghost" onClick={() => setSearchQuery("")}>Ver todas las categorías</Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {filteredCategories.map((cat, i) => (
                                <div key={i} className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 hover:shadow-xl transition-all duration-300 group">
                                    <div className={`w-14 h-14 rounded-2xl ${cat.bg} ${cat.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                        <cat.icon className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">{cat.title}</h3>
                                    <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                                        {cat.description}
                                    </p>
                                    <ul className="space-y-3">
                                        {cat.links.map((link, j) => (
                                            <li key={j}>
                                                <HelpItem
                                                    label={link}
                                                    storeName={store.name}
                                                    email={storeEmail}
                                                    phone={storePhone}
                                                />
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* FAQs Section */}
            <section className="py-20 border-t border-zinc-200 dark:border-zinc-800">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto space-y-12">
                        <h2 className="text-3xl font-bold text-center flex items-center justify-center gap-3">
                            <Info className="w-8 h-8 text-primary" />
                            Preguntas Frecuentes de {store.name}
                        </h2>
                        <Accordion type="single" collapsible className="w-full space-y-4">
                            {faqs.map((faq, i) => (
                                <AccordionItem key={i} value={`faq-${i}`} className="border rounded-2xl px-6 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                                    <AccordionTrigger className="hover:no-underline font-bold text-lg text-left py-6">
                                        {faq.q}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground leading-relaxed pt-2 pb-6">
                                        {faq.a}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
            </section>

            {/* Floating Support Button */}
            <div className="fixed bottom-8 right-8 z-50">
                <Button
                    asChild
                    size="lg"
                    className="h-16 w-16 md:w-auto md:h-14 rounded-full shadow-2xl gap-3 p-0 md:px-6 hover:scale-110 active:scale-95 transition-all"
                    style={{ backgroundColor: "#25D366" }}
                >
                    <a href={`https://wa.me/${storePhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="w-8 h-8 md:w-6 md:h-6 fill-white" />
                        <span className="hidden md:inline font-bold text-white">Chatea con nosotros</span>
                    </a>
                </Button>
            </div>
        </div>
    );
}
