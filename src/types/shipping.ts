export type VehicleCategory = "motorcycle" | "car" | "van" | "truck";
export type LicenseCategory = "B" | "C" | "D" | "E";

export interface Vehicle {
    id: string;
    storeId: string;
    name: string;           // "Camioneta 1"
    plate: string;          // Patente
    category: VehicleCategory;
    brand: string;
    model: string;
    year: number;
    color?: string;
    maxWeightKg: number;    // Capacidad máxima en kg
    maxVolumeM3: number;    // Volumen útil en m³
    maxParcels: number;     // Número máximo de paquetes
    isActive: boolean;
    driverId?: string;      // Conductor asignado
    notes?: string;
    photo?: string;
    createdAt: number;
    updatedAt: number;
}

export interface Driver {
    id: string;
    storeId: string;
    firstName: string;
    lastName: string;
    rut: string;
    phone: string;
    email?: string;
    licenseNumber: string;
    licenseCategory: LicenseCategory;
    licenseExpiry: number;  // timestamp
    isActive: boolean;
    vehicleId?: string;     // Vehículo asignado
    photo?: string;
    notes?: string;
    createdAt: number;
    updatedAt: number;
}

export interface ShippingZone {
    id: string;
    storeId: string;
    name: string;
    communes: string[];          // Comunas que cubre esta zona
    basePrice: number;           // Precio base
    pricePerKg: number;          // Precio adicional por kg
    pricePerM3: number;          // Precio adicional por m³
    maxWeightKg?: number;        // Peso máximo aceptado
    estimatedDays: number;       // Días estimados de entrega
    isActive: boolean;
    createdAt: number;
    updatedAt: number;
}

export type CarrierStatus = "connected" | "error" | "unconfigured";

export interface CarrierConfig {
    enabled: boolean;
    apiKey?: string;
    accountCode?: string;        // Blue Express
    contractNumber?: string;     // Starken
    clientNumber?: string;       // Chile Express
    lastTestedAt?: number;
    status?: CarrierStatus;
}

export interface StoreCarriers {
    blueExpress?: CarrierConfig;
    starken?: CarrierConfig;
    chileExpress?: CarrierConfig;
    ownFleet?: { enabled: boolean };
}

// Carrier metadata (static, for display)
export interface CarrierMeta {
    id: "blueExpress" | "starken" | "chileExpress" | "ownFleet";
    name: string;
    description: string;
    color: string;
    defaultSla: string;
    fields: { key: string; label: string; placeholder: string; secret?: boolean }[];
}

export const CARRIER_META: CarrierMeta[] = [
    {
        id: "blueExpress",
        name: "Blue Express",
        description: "Cobertura nacional. Integración vía API REST.",
        color: "#003087",
        defaultSla: "24-48h",
        fields: [
            { key: "apiKey", label: "API Key", placeholder: "BEX-XXXX-...", secret: true },
            { key: "accountCode", label: "Código de Cuenta", placeholder: "BEX-12345" },
        ],
    },
    {
        id: "starken",
        name: "Starken",
        description: "Envíos nacionales e internacionales.",
        color: "#E30613",
        defaultSla: "3-5 días",
        fields: [
            { key: "apiKey", label: "API Key", placeholder: "sk_live_...", secret: true },
            { key: "contractNumber", label: "N° de Contrato", placeholder: "CL-00123" },
        ],
    },
    {
        id: "chileExpress",
        name: "Chile Express",
        description: "Red de sucursales en todo Chile.",
        color: "#FF6200",
        defaultSla: "24h",
        fields: [
            { key: "apiKey", label: "API Key", placeholder: "cx_...", secret: true },
            { key: "clientNumber", label: "N° de Cliente", placeholder: "12345678" },
        ],
    },
    {
        id: "ownFleet",
        name: "Flota Propia",
        description: "Gestiona tus propios vehículos y conductores.",
        color: "#16a34a",
        defaultSla: "Mismo día",
        fields: [],
    },
];

export const VEHICLE_CATEGORIES: { value: VehicleCategory; label: string; icon: string }[] = [
    { value: "motorcycle", label: "Moto", icon: "🏍️" },
    { value: "car", label: "Auto", icon: "🚗" },
    { value: "van", label: "Camioneta / Furgón", icon: "🚐" },
    { value: "truck", label: "Camión", icon: "🚛" },
];

export const LICENSE_CATEGORIES: LicenseCategory[] = ["B", "C", "D", "E"];
