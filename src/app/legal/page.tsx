"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { LayoutTemplate, ArrowLeft, ShieldCheck, FileText, CreditCard, ChevronRight } from "lucide-react";
import { useState } from "react";

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: (i: number = 0) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.08, duration: 0.55, ease: "easeOut" as any },
    }),
};

const TABS = [
    { id: "terms", label: "Términos y Condiciones", icon: FileText },
    { id: "privacy", label: "Política de Privacidad", icon: ShieldCheck },
    { id: "payments", label: "Política de Pagos", icon: CreditCard },
];

export default function LegalPage() {
    const [active, setActive] = useState("terms");

    return (
        <div className="min-h-screen bg-background text-foreground">

            {/* ═══ NAV ══════════════════════════════════════════════════════════ */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 border-b border-border/40 backdrop-blur-2xl bg-background/70">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-primary to-blue-600 p-2 rounded-xl shadow-lg shadow-primary/30">
                        <LayoutTemplate className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-lg font-bold tracking-tight">EnterpriseOS</span>
                </div>
                <Link href="/">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <ArrowLeft className="h-4 w-4" /> Volver al inicio
                    </Button>
                </Link>
            </nav>

            {/* ═══ HEADER ═══════════════════════════════════════════════════════ */}
            <section className="pt-32 pb-14 px-6 text-center border-b border-border/50 bg-muted/10 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
                <motion.p variants={fadeUp} initial="hidden" animate="show" custom={0}
                    className="text-xs font-semibold tracking-widest text-primary uppercase mb-3 relative z-10">
                    Documentación Legal
                </motion.p>
                <motion.h1 variants={fadeUp} initial="hidden" animate="show" custom={1}
                    className="text-4xl md:text-5xl font-bold tracking-tight font-serif relative z-10">
                    Transparencia Total
                </motion.h1>
                <motion.p variants={fadeUp} initial="hidden" animate="show" custom={2}
                    className="mt-4 text-muted-foreground max-w-xl mx-auto text-lg relative z-10">
                    Aquí encontrarás todo lo que necesitas saber sobre cómo operamos, protegemos tus datos y gestionamos los pagos.
                </motion.p>
                <motion.p variants={fadeUp} initial="hidden" animate="show" custom={3}
                    className="mt-3 text-xs text-muted-foreground relative z-10">
                    Última actualización: 21 de febrero de 2026
                </motion.p>
            </section>

            {/* ═══ TABS ═════════════════════════════════════════════════════════ */}
            <div className="sticky top-16 z-40 border-b border-border/50 bg-background/90 backdrop-blur-xl">
                <div className="max-w-4xl mx-auto px-6 flex overflow-x-auto">
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActive(tab.id)}
                            className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-all duration-200
                ${active === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ═══ CONTENT ══════════════════════════════════════════════════════ */}
            <div className="max-w-4xl mx-auto px-6 py-16">

                {/* ── TÉRMINOS Y CONDICIONES ── */}
                {active === "terms" && (
                    <motion.div key="terms" variants={fadeUp} initial="hidden" animate="show" className="prose-legal">
                        <Section title="1. Aceptación de los Términos">
                            <p>Al acceder y usar EnterpriseOS, aceptas quedar vinculado por estos Términos y Condiciones. Si no estás de acuerdo con alguno de los términos aquí enunciados, no debes usar la plataforma.</p>
                        </Section>
                        <Section title="2. Descripción del Servicio">
                            <p>EnterpriseOS es una plataforma de comercio digital que permite a los usuarios crear, gestionar y operar tiendas en línea. Los servicios incluyen gestión de catálogo, procesamiento de pagos, gestión de envíos, herramientas de marketing y análisis de datos.</p>
                        </Section>
                        <Section title="3. Registro y Cuenta">
                            <p>Para usar la plataforma, debes registrarte con información verídica y actualizada. Eres responsable de mantener la confidencialidad de tu contraseña y de todas las actividades que ocurran bajo tu cuenta.</p>
                        </Section>
                        <Section title="4. Uso Aceptable">
                            <p>Te comprometes a no usar la plataforma para actividades ilegales, fraudulentas o que violen derechos de terceros. EnterpriseOS se reserva el derecho de suspender o terminar cuentas que incumplan estas normas.</p>
                        </Section>
                        <Section title="5. Propiedad Intelectual">
                            <p>Todo el contenido de EnterpriseOS — incluyendo software, diseños, textos y marcas — es propiedad exclusiva de Enterprise Inc. y está protegido por leyes de propiedad intelectual.</p>
                        </Section>
                        <Section title="6. Limitación de Responsabilidad">
                            <p>Enterprise Inc. no será responsable por daños indirectos, incidentales o consecuentes derivados del uso o imposibilidad de uso de la plataforma, hasta el máximo permitido por la ley aplicable.</p>
                        </Section>
                        <Section title="7. Modificaciones">
                            <p>Enterprise Inc. se reserva el derecho de modificar estos términos en cualquier momento. Los cambios serán notificados con al menos 15 días de anticipación por correo electrónico registrado.</p>
                        </Section>
                        <Section title="8. Ley Aplicable">
                            <p>Estos términos se rigen por las leyes de la República de Chile. Cualquier controversia será sometida a los tribunales ordinarios de justicia de Santiago de Chile.</p>
                        </Section>
                    </motion.div>
                )}

                {/* ── PRIVACIDAD ── */}
                {active === "privacy" && (
                    <motion.div key="privacy" variants={fadeUp} initial="hidden" animate="show" className="prose-legal">
                        <Section title="1. Responsable del Tratamiento">
                            <p>Enterprise Inc., RUT XX.XXX.XXX-X, con domicilio en Santiago de Chile, es responsable del tratamiento de tus datos personales conforme a la Ley 19.628 de Protección de la Vida Privada.</p>
                        </Section>
                        <Section title="2. Datos que Recopilamos">
                            <ul>
                                <li><strong>Datos de registro:</strong> Nombre, correo electrónico, RUT o RFC.</li>
                                <li><strong>Datos de uso:</strong> Interacciones con la plataforma, logs de acceso, preferencias.</li>
                                <li><strong>Datos financieros:</strong> Información de pago tokenizada y datos bancarios para payouts (almacenados de forma cifrada).</li>
                                <li><strong>Datos de clientes de tu tienda:</strong> Tú eres el responsable; nosotros somos encargados de tratamiento.</li>
                            </ul>
                        </Section>
                        <Section title="3. Finalidad del Tratamiento">
                            <p>Usamos tus datos para: (a) proveer y mejorar el servicio; (b) procesar pagos y liquidaciones; (c) comunicaciones transaccionales y de soporte; (d) cumplimiento de obligaciones legales.</p>
                        </Section>
                        <Section title="4. Seguridad de los Datos">
                            <p>Implementamos medidas técnicas y organizativas de nivel bancario para proteger tus datos: cifrado AES-256 en reposo, TLS 1.3 en tránsito, logs de auditoría inmutables y controles de acceso por rol.</p>
                        </Section>
                        <Section title="5. Tus Derechos">
                            <p>Tienes derecho a acceder, rectificar, cancelar y oponerte al tratamiento de tus datos. Para ejercer estos derechos, escríbenos a <strong>privacidad@enterpriseos.cl</strong>.</p>
                        </Section>
                        <Section title="6. Compartir Datos con Terceros">
                            <p>No vendemos tus datos. Los compartimos únicamente con proveedores de pago (Stripe, Transbank, MercadoPago, Flow) y servicios de infraestructura (Google Cloud), bajo contratos de confidencialidad estrictos.</p>
                        </Section>
                        <Section title="7. Cookies">
                            <p>Usamos cookies estrictamente necesarias para el funcionamiento de la plataforma y cookies analíticas (optativas) para mejorar la experiencia. Puedes gestionar tus preferencias desde la configuración del navegador.</p>
                        </Section>
                        <Section title="8. Retención de Datos">
                            <p>Los datos se conservan mientras sea necesario para la prestación del servicio o para cumplir con obligaciones legales, con un mínimo de 5 años para documentos financieros según la ley tributaria chilena.</p>
                        </Section>
                    </motion.div>
                )}

                {/* ── POLÍTICA DE PAGOS ── */}
                {active === "payments" && (
                    <motion.div key="payments" variants={fadeUp} initial="hidden" animate="show" className="prose-legal">
                        <div className="mb-10 p-5 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-4">
                            <ShieldCheck className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-muted-foreground">EnterpriseOS opera como facilitador de pagos. Las transacciones son procesadas por los Proveedores de Servicios de Pago (PSPs) certificados por cada red de pago. Nunca almacenamos datos de tarjetas.</p>
                        </div>

                        <Section title="1. Proveedores de Pago">
                            <p>La plataforma integra los siguientes PSPs:</p>
                            <ul>
                                <li><strong>Stripe:</strong> Tarjetas de débito/crédito internacionales.</li>
                                <li><strong>Transbank (Webpay):</strong> Tarjetas emitidas en Chile (Visa, Mastercard, Redcompra).</li>
                                <li><strong>MercadoPago:</strong> Múltiples métodos de pago en LATAM.</li>
                                <li><strong>Flow:</strong> Transferencias bancarias en Chile.</li>
                            </ul>
                        </Section>
                        <Section title="2. Comisiones y Tarifas">
                            <p>Las comisiones de procesamiento son cobradas por los PSPs correspondientes y varían según el método de pago. EnterpriseOS cobra una comisión de plataforma según el plan contratado. Todos los montos se expresan impuestos incluidos.</p>
                        </Section>
                        <Section title="3. Liquidación (Payouts)">
                            <p>Los fondos recaudados son liquidados al comercio bajo el siguiente esquema:</p>
                            <ul>
                                <li><strong>Ventana de maduración:</strong> Los fondos están disponibles para retiro tras 24 horas desde la confirmación del pago, para mitigar el riesgo de chargebacks.</li>
                                <li><strong>Cuenta bancaria:</strong> Debes registrar una cuenta bancaria verificada. Los datos bancarios se congelan al momento de la solicitud de pago (snapshot inmutable).</li>
                                <li><strong>Estados del pago:</strong> SOLICITADO → EN PROCESO → COMPLETADO / FALLIDO. Los payouts fallidos revierten automáticamente el balance al comercio.</li>
                                <li><strong>Límites diarios:</strong> Por seguridad, existen límites de retiro diario por tienda. Para límites personalizados, contacta a soporte.</li>
                            </ul>
                        </Section>
                        <Section title="4. Reembolsos">
                            <p>Los reembolsos pueden ser totales o parciales y quedan sujetos a las políticas de cada PSP. El tiempo de acreditación varía entre 3 y 15 días hábiles dependiendo del banco emisor. Los reembolsos no revierten las comisiones del PSP.</p>
                        </Section>
                        <Section title="5. Disputas y Chargebacks">
                            <p>En caso de disputa iniciada por un cliente ante su banco, EnterpriseOS notificará al comercio dentro de 48 horas. El comercio debe aportar evidencia de la transacción en un plazo máximo de 7 días. Los montos disputados son retenidos hasta la resolución.</p>
                        </Section>
                        <Section title="6. Seguridad Financiera">
                            <p>Aplicamos los siguientes controles de seguridad para proteger el sistema financiero:</p>
                            <ul>
                                <li>Límites de velocidad por operación (velocity limits) para detectar comportamientos abusivos.</li>
                                <li>Monitoreo continuo de integridad del ledger (contabilidad de doble entrada).</li>
                                <li>Modo de solo lectura activable por el equipo de seguridad ante incidentes.</li>
                                <li>Trazabilidad criptográfica de todas las transacciones financieras.</li>
                            </ul>
                        </Section>
                        <Section title="7. Cumplimiento y KYC">
                            <p>En cumplimiento con regulaciones antilavado de dinero, podemos solicitar documentación adicional para verificar la identidad del comercio (KYC - Know Your Customer). Las tiendas no verificadas pueden tener funcionalidades de pago restringidas hasta completar el proceso.</p>
                        </Section>
                        <Section title="8. Contacto">
                            <p>Para consultas sobre pagos, escríbenos a <strong>pagos@enterpriseos.cl</strong> o visita nuestro centro de soporte.</p>
                        </Section>
                    </motion.div>
                )}
            </div>

            {/* ═══ FOOTER ═══════════════════════════════════════════════════════ */}
            <footer className="border-t border-border/50 py-10 px-8 mt-10">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-primary to-blue-600 p-1.5 rounded-lg">
                            <LayoutTemplate className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="font-bold text-sm text-foreground">EnterpriseOS</span>
                    </div>
                    <p>© 2026 Enterprise Inc. · Todos los derechos reservados.</p>
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="gap-2 text-xs">
                            <ArrowLeft className="h-3.5 w-3.5" /> Volver al inicio
                        </Button>
                    </Link>
                </div>
            </footer>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
                <ChevronRight className="h-4 w-4 text-primary flex-shrink-0" />
                <h2 className="text-xl font-bold tracking-tight">{title}</h2>
            </div>
            <div className="text-muted-foreground text-sm leading-7 pl-7 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_li]:leading-6">
                {children}
            </div>
        </div>
    );
}
