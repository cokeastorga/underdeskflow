"use client";

import { useGuide } from "./GuideContext";
import { X, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";

interface FloatingGuideProps {
    guideId: string;
    title: string;
    content: string;
    targetSelector?: string; // CSS selector to position near to (advanced, for now fixed position is fine)
    position?: "bottom-right" | "bottom-left" | "top-right";
}

export function FloatingGuide({ guideId, title, content, position = "bottom-right" }: FloatingGuideProps) {
    const { completedGuides, markGuideAsSeen } = useGuide();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Show after a small delay to not overwhelm immediately
        const timer = setTimeout(() => {
            if (!completedGuides.includes(guideId)) {
                setIsVisible(true);
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [completedGuides, guideId]);

    if (!isVisible) return null;

    const handleDismiss = () => {
        setIsVisible(false);
        markGuideAsSeen(guideId);
    };

    const positionClasses = {
        "bottom-right": "bottom-6 right-6",
        "bottom-left": "bottom-6 left-6",
        "top-right": "top-24 right-6", // top-24 to avoid header
    };

    return (
        <div className={`fixed ${positionClasses[position]} w-80 z-40 animate-in fade-in slide-in-from-bottom-4 duration-500`}>
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
            <Card className="relative border-0 bg-background/80 backdrop-blur-xl shadow-2xl rounded-xl ring-1 ring-white/10 dark:ring-white/5">
                <div className="p-4 relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={handleDismiss}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                    <div className="flex gap-3">
                        <div className="bg-yellow-100 p-2 rounded-full h-fit text-yellow-700">
                            <Lightbulb className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm mb-1">{title}</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {content}
                            </p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
