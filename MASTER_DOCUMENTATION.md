# 📕 Especificación de Software y Propiedad Intelectual - DPapp

## 1. Declaración de Propiedad Intelectual (Ley 17.336)

De acuerdo con la **Ley N° 17.336 sobre Propiedad Intelectual** de la República de Chile, este documento y el código fuente asociado constituyen una obra protegida.

- **Autoría**: El sistema DPapp ha sido desarrollado como una obra de software original.
- **Protección**: La protección abarca el código fuente, código objeto, documentación técnica, manuales de uso y diagramas de arquitectura.
- **Derechos**: Se reserva el derecho exclusivo de reproducción, adaptación y distribución. Queda prohibida la ingeniería inversa o descompilación no autorizada.

## 2. Marco de Procesos del Ciclo de Vida (ISO/IEC 12207)

Este proyecto sigue los lineamientos del estándar **ISO/IEC 12207** para asegurar la calidad y mantenibilidad del software.

### 2.1 Procesos Principales
- **Desarrollo**: Implementación incremental utilizando Next.js 14 y Firebase.
- **Integración**: Sistema de canales (Channels) mediante patrón *Adapter* para marketplaces externos.
- **Operación**: Arquitectura multi-tenant con aislamiento estricto de datos.

### 2.2 Procesos de Soporte
- **Aseguramiento de Calidad**: Pruebas de carga (k6) y simulación de caos (Chaos Simulation Service).
- **Verificación**: Validación de estados mediante FSM (Finite State Machine).
- **Gestión de Configuración**: Control de versiones y despliegue automatizado en Vercel.

---

## 3. Arquitectura del Sistema

### 3.1 Pilares Tecnológicos
- **Infraestructura**: Google Firebase (NoSQL Firestore + Serverless Functions).
- **Frontend**: React 18 / Next.js 14 (App Router) con Tailwind CSS.
- **Seguridad**: Autenticación híbrida (Session Cookies + Firebase Admin SDK).

### 3.2 Módulos Críticos
- **Motor de Pagos (Ledger)**: Sistema de partida doble que garantiza integridad financiera.
- **Resilience Engine**: Implementación de *Circuit Breakers* y *Outbox Pattern* para tolerancia a fallos.
- **Sincronizador de Canales**: Bus de eventos para actualización de stock y precios en tiempo real.

---

## 4. Diccionario de Datos (Firestore Schema)

| Colección | Documento Clave | Atributos Críticos |
|-----------|-----------------|--------------------|
| `stores` | `storeId` | `ownerId`, `currency`, `securityPolicy`, `is_payments_enabled` |
| `users` | `uid` | `email`, `storeId`, `plan`, `role` |
| `products` | `productId` | `name`, `price`, `stock`, `sku`, `category`, `variants[]` |
| `orders` | `orderId` | `total`, `status`, `paymentStatus`, `items[]`, `shippingAddress` |
| `ledger_transactions` | `txId` | `reference_id`, `type`, `entries[]` (Debits/Credits) |
| `channel_connections` | `connId` | `channelType`, `credentials`, `status`, `syncConfig` |

---

## 5. Referencia de API (Endpoints Core)

### Autenticación
- `POST /api/auth/login`: Sincroniza el ID Token de Firebase y establece la cookie de sesión.
- `POST /api/auth/logout`: Invalida la sesión en servidor y cliente.

### Ventas y Pagos
- `POST /api/payments/intents`: Crea un intento de cobro (Zod validado). Procesa cobros de forma nativa e interna.
- `POST /api/payments/refund`: Procesa reembolsos totales o parciales (Requiere aprobación > $1M).
- `POST /api/webhooks/payments/[provider]`: Recepción de eventos internos/nativos de procesamiento.
- `POST /api/webhooks/channels/[channel]/[storeId]`: Sync de marketplaces (Shopify, ML, SumUp) — **Exclusivo Plan Enterprise**.

---

## 6. Guía del Desarrollador (DX)

### Configuración Local
1. Clonar el repositorio.
2. Configurar `.env.local` con las claves de Firebase (Client y Admin).
3. Ejecutar `npm install` y `npm run dev`.

### Extensibilidad
- **Agregar un Canal**: Crear un nuevo archivo en `src/lib/channels/adapters/` implementando la interfaz `ChannelAdapter`.
- **Nuevo Método de Pago**: Registrar el proveedor en `src/lib/payments/registry.ts`.

---

## 7. Verificación y Validación (QA)

- **Carga**: Scripts de `load-test.js` diseñados para simular 1000 VU (Virtual Users).
- **Resiliencia**: `ChaosSimulationService` permite inyectar latencia y errores 500 para validar el comportamiento del sistema bajo estrés.

---
*Este documento es el activo principal de conocimiento técnico y legal de DPapp.*
