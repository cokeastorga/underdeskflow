# Módulo de Autenticación (`Auth`)

El sistema de autenticación de DPapp utiliza **Firebase Auth** integrado con **Next.js 14**, empleando un flujo de sesión basado en cookies para seguridad en el lado del servidor.

## Arquitectura de Autenticación

DPapp utiliza un enfoque híbrido:
1. **Lado del Cliente**: Firebase Client SDK para el login inicial y estado reactivo.
2. **Lado del Servidor**: Firebase Admin SDK para verificar sesiones en API Routes y Server Components.

### Componentes Clave

#### 1. `AuthProvider` (`src/lib/firebase/auth-context.tsx`)
Contexto de React que gestiona el estado del usuario en toda la aplicación.
- **Sincronización de Sesión**: Cuando un usuario hace login en el cliente, `onAuthStateChanged` captura el `idToken` y lo envía a `/api/auth/login`.
- **API `login`**: Este endpoint genera una sesión de cookie (`__session`) usando el Admin SDK.
- **Perfil de Usuario**: Recupera el `storeId` del documento del usuario en Firestore para asociarlo a su sesión.

#### 2. `getVerifiedStore` (`src/lib/auth/get-verified-store.ts`)
Utilidad fundamental para el servidor.
- **Verificación**: Extrae la cookie `__session` y la valida con `adminAuth.verifySessionCookie`.
- **Confianza**: Obtiene el `uid` y `storeId` directamente de Firestore (no se confía en el cliente).
- **Protección**: Redirige automáticamente a `/login` si la sesión no es válida.

#### 3. `assertStoreOwnership`
Asegura que un recurso (identificado por `storeId`) pertenece realmente al usuario autenticado.
```typescript
await assertStoreOwnership(resourceStoreId);
```

## Flujos de Trabajo

### Login
1. El usuario se autentica vía Firebase Client (ej: Google Provider).
2. `AuthProvider` detecta el cambio de estado.
3. Se envía el `idToken` al servidor.
4. El servidor crea una cookie de sesión persistente.

### Logout
1. Se llama a la función `logout` del `AuthProvider`.
2. Se invalida la cookie en `/api/auth/logout`.
3. Se cierra la sesión en el cliente vía `signOut(auth)`.

## Seguridad

> [!IMPORTANT]
> Nunca uses el `uid` o `storeId` enviado desde el cuerpo de una petición POST o parámetros de URL para realizar cambios sin antes verificarlo con `getVerifiedStore`.
