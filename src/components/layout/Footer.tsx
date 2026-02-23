import Link from "next/link"
import { Store } from "@/types/store"
import { Facebook, Instagram, Twitter, Mail, Phone } from "lucide-react"

interface FooterProps {
    store: Store;
}

export function Footer({ store }: FooterProps) {
    return (
        <footer className="border-t bg-muted/40">
            <div className="container py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold">{store.name}</h3>
                        <p className="text-sm text-muted-foreground">
                            {store.description || "Tu tienda de confianza."}
                        </p>
                        <div className="flex space-x-4">
                            {store.socialLinks?.instagram && (
                                <a href={store.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                                    <Instagram className="h-5 w-5" />
                                </a>
                            )}
                            {store.socialLinks?.facebook && (
                                <a href={store.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                                    <Facebook className="h-5 w-5" />
                                </a>
                            )}
                            {store.socialLinks?.twitter && (
                                <a href={store.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                                    <Twitter className="h-5 w-5" />
                                </a>
                            )}
                            {store.socialLinks?.tiktok && (
                                <a href={store.socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                                    {/* Lucide doesn't have TikTok yet, using generic or text */}
                                    <span className="font-bold text-xs">TT</span>
                                </a>
                            )}
                            {store.socialLinks?.whatsapp && (
                                <a href={store.socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                                    <Phone className="h-5 w-5" />
                                </a>
                            )}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Enlaces</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href={`/${store.id}/products`} className="text-muted-foreground hover:text-primary">Productos</Link></li>
                            <li><Link href={`/${store.id}/about`} className="text-muted-foreground hover:text-primary">Nosotros</Link></li>
                            <li><Link href={`/${store.id}/contact`} className="text-muted-foreground hover:text-primary">Contacto</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Contacto</h4>
                        <ul className="space-y-2 text-sm">
                            {store.contactEmail && (
                                <li className="flex items-center gap-2 text-muted-foreground">
                                    <Mail className="h-4 w-4" />
                                    {store.contactEmail}
                                </li>
                            )}
                            {store.phoneNumber && (
                                <li className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="h-4 w-4" />
                                    {store.phoneNumber}
                                </li>
                            )}
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-semibold">Legal</h4>
                        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                            <Link href="/terms" className="hover:underline">Términos y Condiciones</Link>
                            <Link href="/privacy" className="hover:underline">Política de Privacidad</Link>
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} {store.name}. Todos los derechos reservados.</p>
                </div>
            </div>
        </footer>
    )
}
