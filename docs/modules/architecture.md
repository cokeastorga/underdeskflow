# Arquitectura de la Aplicación

DPapp utiliza el **App Router de Next.js 14**, organizando las rutas según el rol del usuario (Administrador, Comerciante o Cliente Final) y la funcionalidad técnica.

## Estructura de Rutas (`src/app`)

La aplicación se divide en tres capas principales:

### 1. Capa de Administración del Comerciante (`/tenant`)
Ubicada en `src/app/tenant`, esta sección es el panel de control para los dueños de tiendas.
- **Dashboard**: Vista general de ventas y métricas.
- **Catálogo**: Gestión de productos, categorías e inventario.
- **Canales**: Configuración de integraciones con marketplaces.
- **Pagos**: Configuración de métodos de pago y visualización del Ledger.

### 2. Capa de Tienda Pública (`/[storeId]`)
Ubicada en `src/app/[storeId]`, utiliza rutas dinámicas para servir múltiples tiendas bajo la misma plataforma.
- **Home**: Landing page personalizada por tienda.
- **Producto**: Detalle de productos y variantes.
- **Checkout**: Flujo de pago optimizado.

### 3. Capa de API (`/api`)
Ubicada en `src/app/api`, expone los endpoints que consumen tanto el frontend como servicios externos.
- `api/auth`: Login/Logout y sincronización de sesión.
- `api/payments`: Creación de intentos de pago y gestión de reembolsos.
- `api/webhooks/payments`: Recepción de eventos de Stripe, MercadoPago, etc.
- `api/webhooks/channels`: Recepción de eventos de Shopify, MercadoLibre, etc.
- `api/channels`: Triggers manuales de sincronización.

## Navegación y Layouts

- **Root Layout**: Configura proveedores globales (Auth, Theme, Toaster).
- **Tenant Layout**: Incluye el Sidebar de navegación administrativa y guardas de seguridad.
- **Store Layout**: Adaptativo según el diseño configurado por el comerciante.

## Consumo de Datos

El frontend utiliza una combinación de:
1. **Server Components**: Para carga de datos inicial directa desde Firestore (usando `adminDb`).
2. **Client Components**: Para interactividad, consumiendo las API Routes mediante `fetch` o hooks personalizados.
3. **Zustand**: Para gestión de estado global ligero (ej: estado del carrito).

---
> [!NOTE]
> Todas las rutas dentro de `/tenant` están protegidas por middleware y el `AuthProvider`, asegurando que solo usuarios autenticados con el `storeId` correcto puedan acceder.
