# UnderDesk Flow (UDF)
> Infraestructura operativa invisible para el comercio digital y físico.

UnderDesk Flow (UDF) es una plataforma SaaS B2B multi-tenant diseñada para unificar la gestión operativa de retail omnicanal. Consolida ventas online, ventas físicas (Punto de Venta - POS), control de inventario y conciliación de pagos en un solo sistema financiero basado en partida doble (Ledger).

## 🚀 Módulos Principales

### 🖥️ Punto de Venta (POS) Híbrido
- Interfaz optimizada para cajeros con soporte táctil.
- Tolerancia a desconexiones (Offline-first mediante Dexie.js).
- Sincronización automática de órdenes encoladas al reconectar (Outbox pattern).
- Integración nativa con equipos POS de **SumUp** (Manejo de keys seguras vía Secret Manager).
- Gestión de restaurantes: Mapa de mesas, apertura manual de cuentas, cobro híbrido, y sistema de comandas impresas hacia cocina vía **TCP/IP nativo protocolo ESC/POS (puerto 9100)**.
- Arqueos de caja y control estricto de sesiones por turno.

### 💰 Motor Financiero (Ledger)
- Doble-partida real. Toda transacción afecta un "Debit" y "Credit".
- Cobros y conciliaciones automáticas unificadas desde Múltiples PSPs (MercadoPago, Flow, Stripe, SumUp).

### 📦 Sincronizador de Inventario y Canales
- Bus de eventos para conciliación de stock omnicanal (Shopify, MercadoLibre).
- Notificación proactiva y consolidación de quiebres de stock.

## 🛠️ Stack Tecnológico
- **Frontend/Backend:** Next.js 14+ (App Router, Server Actions) + React 18 + TailwindCSS.
- **Base de datos:** Firebase Firestore (NoSQL) con soporte para subcolecciones aisladas por tenant.
- **Seguridad:** Firebase Auth (Custom Tokens y Session Cookies) + Google Secret Manager para secretos de integraciones (ej. SumUp).
- **Despliegue:** Vercel.

## 📖 Documentación

La especificación completa del sistema, diccionario de datos, y diagrama de endpoints se encuentra en `MASTER_DOCUMENTATION.md`.
