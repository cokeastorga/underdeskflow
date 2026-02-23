"use client";

import { useEffect, useRef, useState } from "react";

interface FadeInProps {
    children: React.ReactNode;
    delay?: number;
    duration?: number;
    className?: string;
    direction?: "up" | "down" | "left" | "right" | "none";
}

export function FadeIn({ children, delay = 0, duration = 700, className = "", direction = "up" }: FadeInProps) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            {
                threshold: 0.1,
                rootMargin: "50px",
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, []);

    const getTransform = () => {
        switch (direction) {
            case "up": return "translateY(20px)";
            case "down": return "translateY(-20px)";
            case "left": return "translateX(20px)";
            case "right": return "translateX(-20px)";
            default: return "none";
        }
    };

    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "none" : getTransform(),
                transition: `all ${duration}ms cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}ms`,
            }}
        >
            {children}
        </div>
    );
}
