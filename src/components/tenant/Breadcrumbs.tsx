"use strict";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export function Breadcrumbs() {
    const pathname = usePathname();
    const segments = pathname.split("/").filter(Boolean);

    // Skip if only on /tenant (Dashboard)
    if (segments.length <= 1) return null;

    return (
        <nav className="flex items-center text-sm text-muted-foreground">
            <Link href="/tenant" className="hover:text-foreground transition-colors">
                <Home className="h-4 w-4" />
            </Link>
            {segments.map((segment, index) => {
                // Skip "tenant" segment in display if we already have the Home icon
                if (segment === "tenant") return null;

                const href = `/${segments.slice(0, index + 1).join("/")}`;
                const isLast = index === segments.length - 1;
                const formattedSegment = segment.charAt(0).toUpperCase() + segment.slice(1);

                return (
                    <div key={href} className="flex items-center">
                        <ChevronRight className="h-4 w-4 mx-1" />
                        {isLast ? (
                            <span className="font-medium text-foreground">{formattedSegment}</span>
                        ) : (
                            <Link href={href} className="hover:text-foreground transition-colors">
                                {formattedSegment}
                            </Link>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}
