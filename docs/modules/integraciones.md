# Módulo de Integraciones (`Channels`)

El módulo de canales es el motor que sincroniza DPapp con marketplaces externos como Shopify y MercadoLibre. Está diseñado para ser escalable, extensible y tolerante a fallos.

> [!IMPORTANT]
> La sincronización de inventario, catálogo y pedidos con canales externos es una funcionalidad **exclusiva del Plan Enterprise**.

## Arquitectura del Sincronizador

El corazón del sistema es el `SyncOrchestrator` (`src/lib/channels/sync.orchestrator.ts`), que coordina todas las operaciones de entrada y salida.

### Componentes Core

1. **`SyncOrchestrator`**:
   - **Full Sync**: Sincronización inicial de catálogo y pedidos.
   - **Incremental Sync**: Polling adaptativo para traer cambios recientes.
   - **Write-back**: Empuje de cambios locales (stock/precios) hacia el canal externo.
   - **Ingesta de Pedidos**: Normalización de pedidos externos y registro en el Ledger.

2. **Patrón Adapter**:
   - Cada canal externo implementa la interfaz `ChannelAdapter`. Esto permite añadir nuevos mercados sin tocar la lógica del orquestador.

3. **Trazabilidad**:
   - Cada operación genera un `traceId` único que se propaga por todos los logs y escrituras en base de datos para facilitar el debug distribuido.

## Mapeo de Datos

Los datos externos se normalizan a una estructura interna antes de ser persistidos:
- **Productos**: Se guardan en `channel_product_mappings` con un ID compuesto (`channelType:externalId`).
- **Pedidos**: Se guardan en `orders` con el prefijo `ext_`.

## Ciclo de Vida de una Conexión

1. **CONNECTED**: Credenciales validadas.
2. **SYNCING**: Realizando la primera descarga masiva.
3. **ACTIVE**: Operación normal con polling activo.
4. **THROTTLED**: Pausa temporal por exceder límites de API del canal.
5. **ERROR**: Requiere intervención manual (ej: token expirado).

> [!TIP]
> El estado de cada conexión se puede monitorear en tiempo real desde el Dashboard de Administración.
