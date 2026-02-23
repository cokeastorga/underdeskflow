# Módulo de Base de Datos (`Firestore`)

DPapp utiliza **Firebase Firestore** como base de datos principal, estructurada de forma multi-tenant mediante el uso de `storeId` como identificador de tienda.

## Configuración

La aplicación mantiene dos instancias de configuración:

### 1. Client SDK (`src/lib/firebase/config.ts`)
Utilizado en componentes de cliente y hooks.
- **Exports**: `db`, `auth`, `storage`, `googleProvider`.
- **Variables**: Basadas en `NEXT_PUBLIC_FIREBASE_*`.

### 2. Admin SDK (`src/lib/firebase/admin-config.ts`)
Utilizado exclusivamente en el servidor (API Routes, Server Actions).
- **Seguridad**: Utiliza una `Service Account` privada.
- **Exports**: `adminDb`, `adminAuth`.
- **Fail-Fast**: El sistema lanzará un error inmediato al iniciar si faltan las variables de entorno críticas, evitando estados de seguridad inconsistentes.

## Estructura de Datos (Esquema Sugerido)

Aunque Firestore es NoSQL, DPapp sigue este patrón:

| Colección | Propósito | Relación |
|-----------|-----------|----------|
| `users` | Perfiles de usuario y roles | Clave: `uid` |
| `stores` | Configuración de cada tienda | Clave: `storeId` |
| `products` | Catálogo de productos | Contiene `storeId` |
| `orders` | Transacciones y pedidos | Contiene `storeId` |

## Reglas de Seguridad

> [!TIP]
> Las reglas de seguridad se encuentran en el archivo raíz `firestore.rules`. Estas reglas aseguran que ningún usuario pueda leer o escribir datos de otra tienda incluso si conocen su `storeId`.

## Mejores Prácticas en el Proyecto

1. **Uso del Admin SDK**: Siempre que sea posible, realiza las operaciones críticas desde el servidor usando `adminDb` para evitar latencia en el cliente y mejorar la seguridad.
2. **Normalización**: Se recomienda mantener los datos de cada tienda aislados mediante filtrado por `storeId`.
