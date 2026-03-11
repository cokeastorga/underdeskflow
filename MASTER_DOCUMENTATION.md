# 📕 Especificación de Software y Propiedad Intelectual - UnderDesk Flow (UDF)

## 1. Declaración de Propiedad Intelectual (Ley 17.336)

De acuerdo con la **Ley N° 17.336 sobre Propiedad Intelectual** de la República de Chile, este documento y el código fuente asociado constituyen una obra protegida.

- **Autoría**: El sistema UnderDesk Flow ha sido desarrollado como una obra de software original.
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
- **Punto de Venta (POS)**: Sistema de venta física con soporte offline (Dexie.js), integración con terminales SumUp (vía Google Secret Manager), impresión directa a cocina (TCP 9100 ESC/POS) y gestión interactiva de mesas.

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
| `pos_sales` | `clientSaleId` | Venta Idempotente POS, `total`, `items[]`, `status`, `paymentMethod` |
| `cash_sessions` | `sessionId` | Sesiones de caja POS: `openedBy`, `expectedCash`, `actualCash`, `status` |
| `tables` | `tableId` | Gestión de mesas POS: `name`, `status`, `currentOrderId`, `seats` (Sub-colección de `stores`) |


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

### Punto de Venta (POS)
- `POST /api/pos/sale`: Procesamiento idempotente de ventas físicas con soporte offline y encolado.
- `GET / POST /api/pos/tables`: Gestión dinámica del mapa de mesas, aperturas y configuración.
- `PATCH /api/pos/tables/[tableId]`: Modificación de comandos de restaurante (agregar ítem, cerrar cuenta, anular).
- `POST /api/pos/kitchen/print`: Impresión térmica directa vía protocolo ESC/POS en IPs de red local (TCP 9100).
- `GET / POST / PATCH /api/pos/cash-session`: Control ciclo de vida de caja, cuadraturas y take-overs.
- `GET / POST / DELETE /api/pos/sumup/*`: Gestión de terminales SumUp en sucursales físicas usando Secret Manager.


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
*Este documento es el activo principal de conocimiento técnico y legal de UnderDesk Flow.*
