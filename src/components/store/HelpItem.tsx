"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription
} from "@/components/ui/dialog";
import { ChevronRight, Info, AlertCircle, ShieldCheck, ExternalLink, Mail, Phone } from "lucide-react";

interface HelpContent {
    title: string;
    description: string;
}

const helpContentMap: Record<string, HelpContent> = {
    // Compras y Envíos
    "Plazos de entrega": {
        title: "Plazos de Entrega",
        description: "El tiempo de entrega depende de tu ubicación. Para la Región Metropolitana, el plazo es de 2 a 3 días hábiles. Para otras regiones, el tiempo estimado es de 3 a 7 días hábiles. Te enviaremos un correo con la confirmación de {storeName} una vez que tu pedido haya sido despachado."
    },
    "Seguimiento de mi pedido": {
        title: "Seguimiento de Mi Pedido",
        description: "Una vez que tu compra sea procesada por {storeName}, recibirás un número de seguimiento por correo electrónico ({email}). Puedes usar este número en el sitio web del operador logístico asignado para conocer el estado de tu envío en tiempo real."
    },
    "Costos de envío por región": {
        title: "Costos de Envío",
        description: "Los costos de envío en {storeName} se calculan automáticamente durante el proceso de pago (Checkout) basándose en el peso de los productos y la dirección de destino. Ofrecemos tarifas preferenciales gracias a nuestras alianzas logísticas."
    },

    // Garantías y Devoluciones
    "Derecho a Retracto (10 días)": {
        title: "Derecho a Retracto",
        description: "Tienes derecho a retractarte de tu compra en {storeName} dentro de los 10 días siguientes a la recepción del producto. El artículo debe estar sin uso, con su embalaje original sellado y en perfectas condiciones. Este es un derecho legal garantizado por la Ley 19.496."
    },
    "Garantía Legal (6 meses)": {
        title: "Garantía Legal",
        description: "Si tu producto de {storeName} presenta fallas de fabricación o defectos de calidad, cuentas con una garantía legal de 6 meses. Puedes solicitar el cambio, la reparación gratuita o la devolución total de tu dinero, siempre que la falla no sea imputable al mal uso."
    },
    "Cómo iniciar una devolución": {
        title: "Cómo Iniciar una Devolución",
        description: "Para iniciar un proceso de devolución, por favor contáctanos a {email} o al WhatsApp {phone} adjuntando tu número de pedido y fotos del estado del producto. Nuestro equipo revisará tu caso en menos de 48 horas hábiles."
    },

    // Soporte Directo
    "Formulario de contacto": {
        title: "Formulario de Contacto",
        description: "Puedes enviarnos un mensaje directamente a través de nuestra página de Contacto. En {storeName} responderemos a tu solicitud en el orden en que fue recibida, generalmente en menos de un día hábil."
    },
    "WhatsApp de soporte": {
        title: "WhatsApp de Soporte",
        description: "Para una atención más inmediata, puedes escribirnos a nuestro canal de WhatsApp {phone}. Estamos disponibles para resolver dudas sobre stock, productos y estados de pedidos de forma rápida."
    },
    "Horarios de atención": {
        title: "Horarios de Atención",
        description: "Nuestro equipo de atención al cliente de {storeName} atiende de Lunes a Viernes de 09:00 a 18:00 horas (GMT-3). Los mensajes recibidos fuera de este horario serán respondidos al siguiente día hábiles."
    },

    // Legal y Privacidad
    "Términos de servicio": {
        title: "Términos de Servicio",
        description: "Al utilizar el sitio de {storeName}, aceptas nuestras condiciones generales de venta, las cuales rigen la relación entre la tienda y el cliente. Estas incluyen políticas de precios, disponibilidad de stock y uso del sitio web."
    },
    "Política de privacidad": {
        title: "Política de Privacidad",
        description: "En {storeName} tus datos personales están protegidos. Solo utilizamos tu información para procesar pedidos, mejorar tu experiencia y comunicarnos contigo según lo permitido por la Ley de Protección de Datos Personales."
    },
    "Responsabilidad de la plataforma": {
        title: "Responsabilidad de la Plataforma",
        description: "UnderDesk Flow™ es la plataforma tecnológica proveedora del servicio. La responsabilidad sobre la calidad de los productos, el cumplimiento de los despachos y la gestión de devoluciones recae exclusivamente en {storeName} como tienda independiente."
    }
};

interface HelpItemProps {
    label: string;
    storeName: string;
    email: string;
    phone: string;
}

export function HelpItem({ label, storeName, email, phone }: HelpItemProps) {
    const rawContent = helpContentMap[label];

    if (!rawContent) {
        return (
            <button className="text-sm font-medium hover:text-primary flex items-center gap-2 group/link text-left">
                <ChevronRight className="w-3 h-3 text-zinc-300 group-hover/link:text-primary transition-colors" />
                {label}
            </button>
        );
    }

    const cleanPhone = phone.replace(/\D/g, "");

    // Function to render description with interactive links
    const renderDescription = (text: string) => {
        const parts = text.split(/({storeName}|{email}|{phone})/);
        return parts.map((part, i) => {
            if (part === "{storeName}") return <strong key={i} className="text-zinc-900 dark:text-white font-bold">{storeName}</strong>;
            if (part === "{email}") return (
                <a key={i} href={`mailto:${email}`} className="text-primary font-bold hover:underline inline-flex items-center gap-1 transition-all">
                    {email}
                    <Mail className="w-3 h-3" />
                </a>
            );
            if (part === "{phone}") return (
                <a key={i} href={`https://wa.me/${cleanPhone}`} target="_blank" rel="noopener noreferrer" className="text-green-600 dark:text-green-400 font-bold hover:underline inline-flex items-center gap-1 transition-all">
                    {phone}
                    <ExternalLink className="w-3 h-3" />
                </a>
            );
            return part;
        });
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <button className="text-sm font-medium hover:text-primary flex items-center gap-2 group/link text-left transition-all hover:translate-x-1">
                    <ChevronRight className="w-3 h-3 text-zinc-300 group-hover/link:text-primary transition-colors" />
                    {label}
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-3xl p-8 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
                <DialogHeader className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-2">
                        <Info className="w-6 h-6" />
                    </div>
                    <DialogTitle className="text-2xl font-bold tracking-tight">{rawContent.title}</DialogTitle>
                    <div className="flex items-center gap-2 py-1 px-3 rounded-full bg-zinc-100 dark:bg-zinc-800 w-fit">
                        <ShieldCheck className="w-3 h-3 text-green-600" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Información Oficial</span>
                    </div>
                </DialogHeader>
                <div className="mt-6">
                    <div className="text-muted-foreground leading-relaxed text-base italic border-l-4 border-primary/20 pl-4 py-2 bg-primary/5 rounded-r-xl">
                        {renderDescription(rawContent.description)}
                    </div>
                </div>
                <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground bg-zinc-50 dark:bg-zinc-900 p-4 rounded-2xl">
                    <AlertCircle className="w-4 h-4 text-zinc-400" />
                    <span>Esta información está sujeta a los términos y condiciones de la tienda.</span>
                </div>
            </DialogContent>
        </Dialog>
    );
}
