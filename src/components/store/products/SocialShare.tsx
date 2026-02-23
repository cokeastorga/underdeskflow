"use client";

import { Button } from "@/components/ui/button";
import { Facebook, Link as LinkIcon, Twitter } from "lucide-react";
import { toast } from "sonner";

interface SocialShareProps {
    url: string; // We will generate this or pass current URL
    title: string;
}

export function SocialShare({ url, title }: SocialShareProps) {

    // Fallback if running on server or url not ready
    const shareUrl = typeof window !== 'undefined' ? window.location.href : url;

    const copyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard");
    };

    const shareFacebook = () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
    };

    const shareTwitter = () => {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
    };

    const shareWhatsapp = () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(title + " " + shareUrl)}`, '_blank');
    };

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground mr-2">Share:</span>
            <Button size="icon" variant="outline" className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100" onClick={shareFacebook}>
                <Facebook className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="outline" className="h-8 w-8 rounded-full bg-cyan-50 text-cyan-500 border-cyan-100 hover:bg-cyan-100" onClick={shareTwitter}>
                <Twitter className="h-3.5 w-3.5" />
            </Button>
            {/* WhatsApp Icon (using generic MessageCircle or custom SVG if lucide missing whatsapp) */}
            <Button size="icon" variant="outline" className="h-8 w-8 rounded-full bg-green-50 text-green-600 border-green-100 hover:bg-green-100" onClick={shareWhatsapp}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5"
                >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M16.95 14.4c.79-1.23 1.25-2.73 1.25-4.4 0-4.42-3.58-8-8-8s-8 3.58-8 8c0 4.42 3.58 8 8 8 1.67 0 3.17-.46 4.4-1.25L19 19l-2.05-3.6z" />
                </svg>
            </Button>
            <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={copyLink}>
                <LinkIcon className="h-3.5 w-3.5" />
            </Button>
        </div>
    );
}
