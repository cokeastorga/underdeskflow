import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { Store } from "@/types/store";
import { Mail, Phone, MapPin, MessageCircle, HelpCircle, ArrowRight } from "lucide-react";
import { ContactForm } from "@/components/store/ContactForm";
import Link from "next/link";

async function getStore(storeId: string) {
    const docRef = doc(db, "stores", storeId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { ...docSnap.data(), id: docSnap.id } as Store;
    }
    return null;
}

export default async function ContactPage({ params }: { params: Promise<{ storeId: string }> }) {
    const resolvedParams = await params;
    const store = await getStore(resolvedParams.storeId);

    if (!store) {
        return <div className="min-h-screen flex items-center justify-center">Tienda no encontrada</div>;
    }

    const primaryColor = store.design?.colors?.primary || "#000000";

    return (
        <div className="flex-1">
            {/* Header Section */}
            <section className="bg-zinc-50 dark:bg-zinc-900/50 py-20 border-b border-border/50">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Contacto</h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Estamos aquí para ayudarte. Ponte en contacto con nosotros para cualquier duda, sugerencia o consulta sobre tu pedido.
                    </p>
                </div>
            </section>

            <section className="py-20 md:py-32">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                        {/* Contact Info */}
                        <div className="space-y-12">
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold">Información Directa</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    Utiliza cualquiera de nuestros canales oficiales para una respuesta más rápida.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                {store.contactEmail && (
                                    <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-border/50 group hover:border-primary/50 transition-colors duration-300">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-bold mb-1">Email</h3>
                                        <a href={`mailto:${store.contactEmail}`} className="text-sm text-muted-foreground hover:text-primary transition-colors truncate block">
                                            {store.contactEmail}
                                        </a>
                                    </div>
                                )}

                                {store.phoneNumber && (
                                    <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-border/50 group hover:border-green-500/50 transition-colors duration-300">
                                        <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <MessageCircle className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-bold mb-1">WhatsApp</h3>
                                        <a href={`https://wa.me/${store.phoneNumber.replace(/\+/g, '').replace(/\s/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-green-600 transition-colors block">
                                            {store.phoneNumber}
                                        </a>
                                    </div>
                                )}

                                {store.address && (
                                    <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-border/50 sm:col-span-2 group hover:border-blue-500/50 transition-colors duration-300">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-bold mb-1">Dirección</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {store.address}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* FAQ Preview / Help Center */}
                            <div className="p-8 rounded-3xl bg-zinc-950 text-white space-y-6">
                                <div className="flex items-center gap-3">
                                    <HelpCircle className="w-6 h-6 text-primary" />
                                    <h3 className="text-xl font-bold">¿Tienes dudas rápidas?</h3>
                                </div>
                                <p className="text-zinc-400 text-sm leading-relaxed">
                                    Revisa nuestra sección de preguntas frecuentes para obtener respuestas instantáneas sobre envíos, devoluciones y pagos.
                                </p>
                                <Link
                                    href={`/${store.id}/help`}
                                    className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:gap-4 transition-all"
                                >
                                    Ver Centro de Ayuda <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>

                        {/* Contact Form Wrapper */}
                        <div className="relative">
                            <ContactForm storeId={store.id} primaryColor={primaryColor} />

                            {/* Decorative element */}
                            <div className="absolute -z-10 -bottom-6 -right-6 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
                            <div className="absolute -z-10 -top-6 -left-6 w-32 h-32 bg-secondary/5 rounded-full blur-3xl opacity-50" />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
