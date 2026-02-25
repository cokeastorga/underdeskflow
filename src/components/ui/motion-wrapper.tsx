"use client";

import { motion, HTMLMotionProps, Variants } from "framer-motion";
import { ReactNode } from "react";

interface MotionWrapperProps extends HTMLMotionProps<"div"> {
    children: ReactNode;
    delay?: number;
    duration?: number;
    direction?: "up" | "down" | "left" | "right" | "none";
    staggerChildren?: number;
    once?: boolean;
}

const variants: Variants = {
    hidden: (direction: string) => ({
        opacity: 0,
        y: direction === "up" ? 40 : direction === "down" ? -40 : 0,
        x: direction === "left" ? 40 : direction === "right" ? -40 : 0,
        transition: {
            type: "spring",
            damping: 20,
            stiffness: 100,
        },
    }),
    visible: {
        opacity: 1,
        y: 0,
        x: 0,
        transition: {
            type: "spring",
            damping: 25,
            stiffness: 120,
        },
    },
};

export function MotionWrapper({
    children,
    delay = 0,
    duration = 0.5,
    direction = "up",
    staggerChildren = 0,
    once = true,
    className = "",
    ...props
}: MotionWrapperProps) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once, margin: "-50px" }}
            variants={variants}
            custom={direction}
            transition={{
                delay,
                duration,
                staggerChildren,
            }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
}

export const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1,
        },
    },
};

export const staggerItem: Variants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: "spring",
            damping: 20,
            stiffness: 100,
        },
    },
};
