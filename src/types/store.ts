import { StoreCarriers } from "./shipping";
import { PlanId } from "./billing";
import { StoreStatus } from "./payments";

export interface CarouselSlide {
    id: string;
    title: string;
    subtitle: string;
    image: string;
    ctaText: string;
    ctaLink: string;
}

export interface PromoBanner {
    id: string;
    title: string;
    subtitle: string;
    ctaText: string;
    ctaLink: string;
    backgroundColor: string; // e.g. "bg-blue-900" or hex
    position: number; // 1, 2, 3... to determine order/placement
}

export interface Store {
    id: string; // matches storeId
    name: string;
    description?: string; // New
    logo?: string;
    favicon?: string; // New
    ownerId: string;
    legalName?: string; // New: Official company name
    taxId?: string; // New: RUT/Tax ID
    createdAt: number;
    currency: string;
    customDomain?: string; // New

    // Contact Info (New)
    contactEmail?: string;
    phoneNumber?: string;
    socialLinks?: {
        instagram?: string;
        facebook?: string;
        twitter?: string;
        tiktok?: string; // New
        whatsapp?: string; // New
    };
    address?: string; // New

    onboardingStatus?: "pending" | "completed" | number; // number indicates current step
    plan?: PlanId; // denormalized from user profile for fast reads

    // Configuration
    apiKeys?: {
        stripe?: string;
        mercadoPago?: string;
        transbank?: string;
    };
    fulfillment?: {
        pickup: boolean;
        delivery: boolean;
    };
    carriers?: StoreCarriers;
    design?: {
        template: "modern" | "minimal" | "bold";
        gridColumns: 3 | 4 | 6;

        // Colors & Typography
        colors?: {
            primary: string;
            secondary: string;
            background: string;
            text: string;
        };
        typography?: {
            headingFont: string;
            bodyFont: string;
        };

        // Layout Components
        header?: {
            layout: 'left' | 'center';
            showSearch: boolean;
            showIcons: boolean;
        };
        footer?: {
            layout: 'simple' | 'columns';
            showSocial: boolean;
            showNewsletter: boolean;
            copyrightText?: string;
        };
        announcementBar?: {
            text: string;
            link?: string;
            active: boolean;
            backgroundColor: string;
            textColor: string;
        };

        // Sections & Content
        homeSections?: {
            id: string;
            type: 'featured-products' | 'categories' | 'testimonials' | 'newsletter' | 'benefits';
            title?: string;
            enabled: boolean;
            order: number;
        }[];

        // Product Listing
        productFilters?: {
            enablePriceRange: boolean;
            enableCategories: boolean;
            enableBrands: boolean;
            enableAttributes: boolean; // Size, Color, etc.
        };

        cardStyle: {
            showSubtitle: boolean;
            showPrice: boolean;
            priceSize: "sm" | "md" | "lg";
            shadow: "none" | "sm" | "md";
            border: boolean;
            hoverEffect: "none" | "zoom" | "lift"; // New
            buttonStyle: "solid" | "outline" | "text"; // New
        };
        heroCarousel?: CarouselSlide[]; // Needs update types if we want more options
        promoBanners?: PromoBanner[];
        customCSS?: string; // New
    };

    domains?: {
        name: string;
        status: 'pending' | 'active' | 'error';
        verified: boolean;
        dnsRecord?: string; // e.g. "cname.vercel-dns.com"
        createdAt: number;
    }[];

    // ── FINANCIAL & COMPLIANCE (New) ──────────────────────────────────
    compliance_status: StoreStatus;
    is_read_only?: boolean;        // If true, blocks all state-mutating financial ops
    bank_account?: {
        bank_name: string;
        account_number: string;
        account_type: string;
        entity_id: string; // RUT/Tax ID
        verified: boolean;
    };
}

export interface UserProfile {
    uid: string;
    email: string | null;
    storeId?: string; // Link to the user's store
}
