import Link from "next/link"
import { Store } from "@/types/store"
import { Facebook, Instagram, Twitter, Mail, Phone, ArrowRight } from "lucide-react"

interface FooterProps {
    store: Store;
}

export function Footer({ store }: FooterProps) {
    return (
        <footer className="bg-white dark:bg-zinc-950 border-t border-gray-100 dark:border-zinc-900">
            <div className="container mx-auto px-6 py-20 md:py-28">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 lg:gap-8">
                    {/* Brand Section */}
                    <div className="lg:col-span-4 space-y-8">
                        <div>
                            <h3 className="text-2xl font-bold tracking-tighter uppercase italic mb-4">{store.name}</h3>
                            <p className="text-muted-foreground font-light leading-relaxed max-w-sm">
                                {store.description || "Curating excellence in every detail. Your destination for premium shopping and unique experiences."}
                            </p>
                        </div>
                        <div className="flex space-x-6">
                            {store.socialLinks?.instagram && (
                                <a href={store.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                                    <Instagram className="h-5 w-5" strokeWidth={1.5} />
                                </a>
                            )}
                            {store.socialLinks?.facebook && (
                                <a href={store.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                                    <Facebook className="h-5 w-5" strokeWidth={1.5} />
                                </a>
                            )}
                            {store.socialLinks?.twitter && (
                                <a href={store.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                                    <Twitter className="h-5 w-5" strokeWidth={1.5} />
                                </a>
                            )}
                            {store.socialLinks?.whatsapp && (
                                <a href={store.socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                                    <Phone className="h-5 w-5" strokeWidth={1.5} />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Links Grid */}
                    <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-12">
                        <div className="space-y-6">
                            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-black dark:text-white">Explorar</h4>
                            <ul className="space-y-4">
                                <li><Link href={`/${store.id}/products`} className="text-sm font-light text-muted-foreground hover:text-black dark:hover:text-white transition-colors underline-offset-4 hover:underline">Productos</Link></li>
                                <li><Link href={`/${store.id}/about`} className="text-sm font-light text-muted-foreground hover:text-black dark:hover:text-white transition-colors underline-offset-4 hover:underline">Nosotros</Link></li>
                                <li><Link href={`/${store.id}/contact`} className="text-sm font-light text-muted-foreground hover:text-black dark:hover:text-white transition-colors underline-offset-4 hover:underline">Contacto</Link></li>
                                <li><Link href={`/${store.id}/help`} className="text-sm font-light text-muted-foreground hover:text-black dark:hover:text-white transition-colors underline-offset-4 hover:underline">Ayuda</Link></li>
                                <li className="pt-2">
                                    <Link
                                        href={`/${store.id}/help`}
                                        className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:gap-4 transition-all"
                                    >
                                        Ver Centro de Ayuda <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div className="space-y-6">
                            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-black dark:text-white">Atención</h4>
                            <ul className="space-y-4">
                                {store.contactEmail && (
                                    <li className="flex flex-col gap-1">
                                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">Email</span>
                                        <a href={`mailto:${store.contactEmail}`} className="text-sm font-light text-muted-foreground hover:text-black dark:hover:text-white truncate">{store.contactEmail}</a>
                                    </li>
                                )}
                                {store.phoneNumber && (
                                    <li className="flex flex-col gap-1">
                                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">Llámanos</span>
                                        <a href={`tel:${store.phoneNumber}`} className="text-sm font-light text-muted-foreground hover:text-black dark:hover:text-white">{store.phoneNumber}</a>
                                    </li>
                                )}
                            </ul>
                        </div>

                        <div className="space-y-6 col-span-2 md:col-span-1">
                            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-black dark:text-white">Legal</h4>
                            <ul className="space-y-4">
                                <li><Link href={`/${store.id}/help`} className="text-sm font-light text-muted-foreground hover:text-black dark:hover:text-white underline-offset-4 hover:underline">Términos</Link></li>
                                <li><Link href={`/${store.id}/help`} className="text-sm font-light text-muted-foreground hover:text-black dark:hover:text-white underline-offset-4 hover:underline">Privacidad</Link></li>
                                <li><Link href={`/${store.id}/help`} className="text-sm font-light text-muted-foreground hover:text-black dark:hover:text-white underline-offset-4 hover:underline">Seguridad</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mt-28 pt-8 border-t border-gray-50 dark:border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        &copy; {new Date().getFullYear()} {store.name}. UnderDesk Flow™ Platform.
                    </p>
                    <div className="flex gap-8 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                        <span>PAGO SEGURO</span>
                        <span>ENVÍO EXPRESS</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
