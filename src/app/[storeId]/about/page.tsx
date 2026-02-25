import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { Store } from "@/types/store";
import { BookOpen, Target, Eye, Shield } from "lucide-react";

async function getStore(storeId: string) {
    const docRef = doc(db, "stores", storeId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { ...docSnap.data(), id: docSnap.id } as Store;
    }
    return null;
}

export default async function AboutPage({ params }: { params: Promise<{ storeId: string }> }) {
    const resolvedParams = await params;
    const store = await getStore(resolvedParams.storeId);

    if (!store) {
        return <div className="min-h-screen flex items-center justify-center">Tienda no encontrada</div>;
    }

    const about = store.aboutPage;
    const primaryColor = store.design?.colors?.primary || "#000000";

    return (
        <div className="flex-1">
            {/* Hero Section */}
            <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    {about?.image1 ? (
                        <img
                            src={about.image1}
                            alt={about.title || store.name}
                            className="w-full h-full object-cover brightness-50"
                        />
                    ) : (
                        <div className="w-full h-full bg-zinc-900" />
                    )}
                </div>

                <div className="container relative z-10 mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {about?.title || "Nuestra Historia"}
                    </h1>
                    <p className="text-lg md:text-xl text-zinc-200 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000">
                        {store.name} — Una experiencia única diseñada para ti.
                    </p>
                </div>
            </section>

            {/* Content Section */}
            <section className="py-20 md:py-32">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                                <BookOpen className="w-3 h-3" /> Conócenos
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                                Pasión por lo que hacemos
                            </h2>
                            <div className="text-muted-foreground leading-relaxed space-y-4">
                                {about?.description ? (
                                    about.description.split('\n').map((para, i) => (
                                        <p key={i}>{para}</p>
                                    ))
                                ) : (
                                    <p>Bienvenido a {store.name}. Nos dedicamos a ofrecer los mejores productos con la más alta calidad y un servicio excepcional.</p>
                                )}
                            </div>
                        </div>

                        <div className="relative aspect-square md:aspect-auto md:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                            {about?.image2 ? (
                                <img
                                    src={about.image2}
                                    alt="Story Image"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                    <StoreIcon className="w-20 h-20 text-zinc-300" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission & Vision */}
            {(about?.mission || about?.vision) && (
                <section className="py-20 bg-zinc-50 dark:bg-zinc-900/50">
                    <div className="container mx-auto px-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {about?.mission && (
                                <div className="p-8 md:p-12 rounded-3xl bg-white dark:bg-zinc-950 border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                                        <Target className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4">Nuestra Misión</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {about.mission}
                                    </p>
                                </div>
                            )}
                            {about?.vision && (
                                <div className="p-8 md:p-12 rounded-3xl bg-white dark:bg-zinc-950 border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center mb-6" style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}>
                                        <Eye className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4">Nuestra Visión</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {about.vision}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Values Section */}
            {about?.values && about.values.length > 0 && (
                <section className="py-20 md:py-32">
                    <div className="container mx-auto px-4">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">Nuestros Valores</h2>
                            <p className="text-muted-foreground">Lo que nos define y guía en cada paso que damos.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {about.values.map((val) => (
                                <div key={val.id} className="text-center p-6 space-y-4">
                                    <div className="w-16 h-16 mx-auto rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                        <Shield className="w-8 h-8 text-primary" />
                                    </div>
                                    <h4 className="text-xl font-bold">{val.title}</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {val.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}

function StoreIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
            <path d="M2 7h20" />
            <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
        </svg>
    )
}
