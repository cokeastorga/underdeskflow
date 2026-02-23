import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PromoBannerProps {
    title: string;
    subtitle: string;
    cta: string;
    link: string;
    color?: string; // bg color class or hex
}

export function PromoBanner({ title, subtitle, cta, link, color = "bg-primary" }: PromoBannerProps) {
    return (
        <section className={`w-full py-12 md:py-16 ${color} text-white`}>
            <div className="container flex flex-col md:flex-row items-center justify-between gap-6 px-4 md:px-6">
                <div className="space-y-2 text-center md:text-left">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl font-serif">
                        {title}
                    </h2>
                    <p className="text-lg opacity-90 max-w-[600px]">
                        {subtitle}
                    </p>
                </div>
                <Link href={link}>
                    <Button variant="secondary" size="lg" className="rounded-full px-8 font-semibold shadow-lg hover:shadow-xl transition-all">
                        {cta}
                    </Button>
                </Link>
            </div>
        </section>
    );
}
