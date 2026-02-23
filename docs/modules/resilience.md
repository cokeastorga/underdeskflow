# Módulo de Resiliencia y QA

DPapp implementa patrones avanzados de ingeniería de resiliencia para asegurar la estabilidad operacional bajo carga o ante fallos de APIs externas.

## Patrones de Resiliencia

### 1. Circuit Breaker (`circuit-breaker.ts`)
Protege el sistema contra "fallos en cascada". Si un canal externo (ej: Shopify) empieza a fallar repetidamente, el circuito se **ABRE**.
- ** CLOSED**: Funcionamiento normal.
- ** OPEN**: Las peticiones fallan inmediatamente (fail-fast) sin intentar contactar al API externa.
- ** HALF_OPEN**: Periodo de prueba para verificar si el servicio externo se ha recuperado.

### 2. Rate Limited Queue (`rate-limited-queue.ts`)
Implementa el algoritmo **Token Bucket** por cada conexión.
- Asegura que nunca excedamos el límite de peticiones por minuto (RPM) permitido por el marketplace.
- Gestiona prioridades (`HIGH`, `MEDIUM`, `LOW`). Por ejemplo, una actualización de precio tiene mayor prioridad que una sincronización de descripción.

### 3. Outbox Pattern (`outbox.service.ts`)
Garantiza la entrega **"At-least-once"** (al menos una vez).
- En lugar de llamar al API externa directamente durante una petición web, el evento se guarda en una tabla `outbox_events`.
- Un worker procesa estos eventos en segundo plano, reintentando con **backoff exponencial** en caso de error.

## Seguridad y Compliance

### `SecurityGuardService`
- **Velocity Limits**: Previene el abuso de API limitando el número de sincronizaciones por minuto por tienda.
- **Global Kill Switch**: Permite a los administradores desconectar una tienda o un canal instantáneamente en caso de emergencia o fraude detectado.

## QA & Chaos Engineering

### `ChaosSimulationService`
Permite inyectar fallos controlados para verificar que el sistema reacciona correctamente:
- **LATENCY**: Añade retrasos artificiales (ej: 10s).
- **RATE_LIMIT**: Simula errores 429 para probar el throttling.
- **AUTH_ERROR**: Simula tokens expirados.
- **INTERNAL_ERROR**: Simula errores 500 del lado del proveedor.

> [!IMPORTANT]
> Estas herramientas de caos solo deben activarse en entornos de staging o mediante flags de desarrollador específicos.
