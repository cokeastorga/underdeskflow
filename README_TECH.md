# UnderDesk Flow (UDF) - Documentación Técnica

> [!IMPORTANT]
> **[Ver Especificación Técnica e Intelectual (ISO 12207 + Ley 17.336)](./MASTER_DOCUMENTATION.md)**

> [!NOTE]
> **[Ver Presentación del Proyecto (Visión General)](./PRESENTATION.md)**

Bienvenido a la documentación técnica de **UnderDesk Flow**, una plataforma de comercio electrónico multi-tienda de alto rendimiento.

## Arquitectura General

UnderDesk Flow está construido sobre **Next.js 14** (App Router) y **Firebase**, utilizando una arquitectura de microservicios lógica dentro de un monolito modular.

### Módulos Principales

| Módulo | Descripción | Enlace |
|--------|-------------|--------|
| **Auth** | Gestión de sesiones, seguridad y roles. | [auth.md](./docs/modules/auth.md) |
| **Firestore** | Estructura de datos, persistencia y reglas. | [firestore.md](./docs/modules/firestore.md) |
| **Integraciones** | Sincronización con Marketplace (Shopify, ML, etc.). | [integraciones.md](./docs/modules/integraciones.md) |
| **Resilience** | Tolerancia a fallos, Circuit Breakers y Chaos Engineering. | [resilience.md](./docs/modules/resilience.md) |
| **Payments** | Procesamiento de pagos, Ledger y FSM. | [payments.md](./docs/modules/payments.md) |
| **Arquitectura** | Estructura de rutas (Next.js App Router) y API. | [architecture.md](./docs/modules/architecture.md) |
| **UI Components** | Sistema de diseño, Shadcn/UI y Temas. | [components.md](./docs/modules/components.md) |

## Stack Tecnológico

- **Frontend**: Next.js 14, Tailwind CSS, Shadcn/UI, Lucide Icons.
- **Backend / Server**: Next.js API Routes, Firebase Admin SDK.
- **Persistencia**: Google Firestore, Firebase Storage.
- **Seguridad**: Firebase Auth (Session Cookies).
- **QA / Resiliencia**: Chaos Simulation Service, Load Testing (k6).

## Estructura de Directorios

- `src/app`: Rutas, páginas y API endpoints.
- `src/components`: Componentes UI organizados por contexto (landing, store, tenant).
- `src/lib`: Lógica de negocio, servicios y utilidades core.
- `src/store`: Gestión de estado global (Zustand/Context).

---
*Documentación generada automáticamente por Antigravity AI.*
