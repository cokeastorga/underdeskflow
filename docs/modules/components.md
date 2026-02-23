# Sistema de Componentes y UI

DPapp utiliza una arquitectura de componentes atómica basada en **Shadcn/UI**, **Tailwind CSS** y **Radix UI**, garantizando una interfaz premium, accesible y consistente.

## Estructura de Componentes (`src/components`)

Los componentes están organizados por contexto de uso para evitar acoplamientos innecesarios:

### 1. Primitivas UI (`/ui`)
Contiene los átomos de la interfaz (botones, inputs, tarjetas, diálogos).
- **Fuente**: Shadcn/UI.
- **Estilo**: Altamente personalizable mediante clases de Tailwind.

### 2. Componentes de Tienda (`/store`)
Componentes específicos para la experiencia del cliente final en el storefront.
- `ProductCard`: Visualización de productos con estados de carga.
- `CartSheet`: Gestión lateral del carrito de compras.
- `Navbar`: Navegación adaptativa para la tienda.

### 3. Componentes de Comerciante (`/tenant`)
Componentes para el panel de administración.
- `Sidebar`: Navegación principal del dashboard.
- `StatCard`: Visualización de métricas financieras.
- `DataTables`: Tablas avanzadas con filtrado y paginación para pedidos y productos.

### 4. Componentes de Aterrizaje (`/landing`)
Componentes para la página principal de marketing de la plataforma.

## Diseño y Estilización

### Sistema de Temas
El proyecto utiliza variables de CSS integradas con Tailwind (`src/app/globals.css`) para soportar:
- **Modo Oscuro/Claro**: Gestionado vía `next-themes`.
- **Personalización por Tenant**: Las tiendas pueden inyectar su propia paleta de colores que sobrescribe las variables base.

### Micro-animaciones
Se utiliza `framer-motion` y clases de utilidad de CSS para transiciones suaves y efectos de hover que mejoran la percepción de calidad ("Luxury UX").

## Mejores Prácticas

1. **Composición**: Se prefiere la composición de componentes sobre props booleanas excesivas.
2. **Accesibilidad**: Todos los componentes UI siguen los estándares WAI-ARIA (vía Radix UI).
3. **Skeleton Loading**: Se utilizan estados de carga (skeletons) para mejorar la percepción de velocidad en cargas asíncronas.

---
> [!TIP]
> Para añadir un nuevo componente de Shadcn, usa el comando: `npx shadcn-ui@latest add [component-name]`
