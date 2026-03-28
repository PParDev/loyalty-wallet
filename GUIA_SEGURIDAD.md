# Guía de Seguridad Web — LoyaltyWallet

> Esta guía documenta los problemas de seguridad encontrados en el proyecto, explica por qué
> son peligrosos, cómo se corrigieron, y qué principios debes tener en mente para no volver
> a caer en los mismos errores. Está escrita para que entiendas el "por qué", no solo el "qué".

---

## 1. Endpoints de Debug en Producción

### ¿Qué era el problema?

Existían dos rutas completamente abiertas al público:

- `GET /api/wallet/debug` — devolvía el email de la service account de Google, el ISSUER_ID, y los tokens de autenticación de la API.
- `GET /api/admin/check-env` — mostraba si las variables de entorno del administrador estaban configuradas y las primeras letras del email admin.

No requerían ningún tipo de autenticación. Cualquier persona en internet podía llamarlas.

### ¿Por qué es peligroso?

Estos endpoints se crearon para depurar errores durante el desarrollo — completamente válido. El error fue **dejarlos en el código de producción**.

Cuando un atacante encuentra un endpoint así, tiene:

1. **El email de tu service account de Google** → puede intentar phishing o enumerar recursos de tu proyecto en GCP.
2. **El ISSUER_ID** → identifica públicamente tu cuenta de Google Wallet. Con esto y el email puede intentar ataques dirigidos a la API.
3. **Confirmación de qué credenciales existen** → le dice exactamente qué buscar si logra acceso a tu servidor.

Esto se llama **Information Disclosure** — revelar información interna que no debería ser pública. Es el punto de partida de la mayoría de los ataques reales: primero el atacante observa, luego actúa.

### La regla

> **Nunca dejes endpoints de debug en producción sin autenticación.**

La forma correcta de manejar esto:

- Durante desarrollo: el endpoint puede existir, pero protegido con `verifyAdminToken()`.
- Antes de lanzar a producción: **eliminar** los endpoints de debug, o moverlos a scripts locales que nunca llegan al servidor.
- Usa logs del servidor (`console.log` en el servidor) para depurar — eso nunca es visible para el público.

### Lo que se hizo

Se eliminaron ambos archivos. No se protegieron — se borraron. Si en el futuro necesitas depurar, crea el endpoint de nuevo, úsalo, y bórralo antes de hacer push.

---

## 2. Validación de Parámetros de Entrada (DoS por Paginación)

### ¿Qué era el problema?

En `GET /api/customers`, el parámetro `limit` se leía directamente sin validar:

```typescript
// ❌ Antes — sin validación
const limit = parseInt(searchParams.get("limit") ?? "20");
```

Esto significa que cualquier usuario autenticado podía hacer:

```
GET /api/customers?limit=999999999
```

### ¿Por qué es peligroso?

Cuando Prisma ejecuta `take: 999999999`, tu base de datos intenta devolver casi mil millones de registros. Aunque no tengas tantos clientes, el intento:

1. **Agota la memoria** del servidor de la función serverless de Vercel.
2. **Bloquea conexiones** a la base de datos en PostgreSQL.
3. **Genera un timeout** que deja a los demás usuarios sin servicio.

Esto es un ataque de **Denegación de Servicio (DoS)** — no destruye datos, pero deja el sistema inutilizable. Lo más alarmante: no requiere ser un atacante sofisticado, cualquier cliente mal intencionado puede hacer esto con una petición simple.

### La regla

> **Nunca confíes en los datos que vienen del cliente. Siempre valida y limita.**

La fórmula para paginación segura:

```typescript
// ✅ Después — validado y limitado
const rawPage = parseInt(searchParams.get("page") ?? "1");
const rawLimit = parseInt(searchParams.get("limit") ?? "20");
const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
const limit = isNaN(rawLimit) || rawLimit < 1 ? 20 : Math.min(rawLimit, 100);
//                                                         ↑ máximo permitido: 100 registros
```

Reglas de oro para inputs del cliente:
- ¿Es un número? → verifica que no sea `NaN`, que tenga mínimo y máximo.
- ¿Es un string? → verifica longitud máxima.
- ¿Es un enum? → usa `z.enum([...])` de Zod.
- ¿Es un UUID? → usa `z.string().uuid()`.

La librería **Zod** que ya usas en el proyecto fue diseñada exactamente para esto. Úsala en **todas** las API routes, no solo en las que reciben body JSON — también en query params.

---

## 3. Filtros de Soft Delete

### ¿Qué era el problema?

El sistema usa **soft delete** para las recompensas: en vez de borrarlas de la base de datos, las marca como `isActive: false`. El problema estaba en el query del dashboard:

```typescript
// ❌ Antes — muestra TODAS, incluyendo las "eliminadas"
const rewards = await prisma.reward.findMany({
  where: { programId: program.id },
});
```

El endpoint de escaneo sí lo filtraba correctamente:
```typescript
// ✅ En /api/scan — correcto
rewards: { where: { isActive: true } }
```

### ¿Por qué es peligroso?

Esto es un bug funcional que puede convertirse en un problema de negocio serio:

1. **El dueño del negocio "elimina" una recompensa** porque ya no la quiere ofrecer.
2. **El dashboard sigue mostrándola** como disponible.
3. El cajero puede intentar canjearla desde el panel de administración.
4. Se generan inconsistencias en la base de datos y confusion operacional.

Más importante: el soft delete **existe para poder recuperar datos accidentalmente borrados** y para mantener el historial de canjes (`RewardRedemption` referencia el `rewardId`). Si haces hard delete, los registros históricos quedan huérfanos y falla la base de datos con errores de foreign key.

### La regla

> **Cuando usas soft delete, debes filtrar `isActive: true` en TODOS los queries de lectura.**

Si en algún lugar del sistema no filtras, estás tratando el dato borrado como si existiera. La inconsistencia entre endpoints es exactamente el tipo de bug que es muy difícil de rastrear.

**Patrón recomendado:** Si tienes muchos modelos con soft delete, crea una extensión de Prisma o una función wrapper que siempre añada el filtro automáticamente.

### Lo que se hizo

```typescript
// ✅ Después
const rewards = await prisma.reward.findMany({
  where: { programId: program.id, isActive: true },
});
```

---

## 4. Headers de Seguridad HTTP

### ¿Qué era el problema?

El proyecto no configuraba ningún header de seguridad HTTP. Cualquier respuesta del servidor llegaba sin instrucciones al navegador sobre cómo manejar el contenido.

### ¿Qué son los headers de seguridad?

Son instrucciones que el servidor manda al navegador junto con cada respuesta. El navegador las obedece y se protege solo. Son la primera línea de defensa contra varios ataques comunes.

Los que se añadieron:

#### `X-Frame-Options: SAMEORIGIN`
Impide que tu app se cargue dentro de un `<iframe>` en otro sitio web. Sin esto, un atacante puede hacer **clickjacking**: pone tu app en un iframe invisible encima de su página, y cuando el usuario "hace click en algo de su página", en realidad está haciendo click en tu app — confirmando pagos, cambiando configuraciones, etc.

#### `X-Content-Type-Options: nosniff`
Sin esto, si alguien sube un archivo `.jpg` que en realidad contiene código JavaScript, algunos navegadores lo ejecutarían. Este header le dice al navegador: "confía solo en el Content-Type que el servidor declara, no intentes adivinar".

#### `Referrer-Policy: strict-origin-when-cross-origin`
Controla qué URL se incluye en el header `Referer` cuando el usuario navega a otro sitio. Sin esto, si un usuario está en `tudominio.com/dashboard/customers?search=juan123` y hace click en un link externo, ese sitio externo ve la URL completa. Con esta política, solo ve el dominio de origen (`tudominio.com`), sin la ruta ni los query params.

#### `Permissions-Policy: camera=(self), geolocation=(), microphone=()`
Lista explícita de qué APIs del navegador puede usar tu app. La cámara solo en tu propio dominio (para el escáner QR), geolocalización y micrófono bloqueados. Si en algún momento se inyectara código malicioso en tu app, no podría activar el micrófono o el GPS del usuario.

#### `Strict-Transport-Security`
Le dice al navegador: "este sitio SIEMPRE usa HTTPS, nunca intentes cargarlo por HTTP". Previene ataques de downgrade donde un atacante en la misma red (ej: WiFi pública) fuerza la conexión a HTTP no cifrado para interceptar el tráfico.

### La regla

> **Los headers de seguridad son baratos de añadir y son tu red de seguridad.**

Son configuración, no código. Se añaden una vez y protegen toda la app. Herramienta para verificarlos: [securityheaders.com](https://securityheaders.com).

**Header pendiente — Content Security Policy (CSP):** El más poderoso de todos. Define exactamente de qué dominios puede cargar scripts, estilos, imágenes, etc. tu app. Bloquea ataques XSS de raíz. No se añadió en esta iteración porque Next.js requiere usar **nonces** para que funcione correctamente con sus scripts inline. Es un ejercicio para una siguiente iteración.

---

## 5. Sesiones de Cuentas Suspendidas

### ¿Qué era el problema?

Cuando un negocio se suspendía desde el panel de administración:
- Se bloqueaba el **próximo intento de login** ✅
- Se mostraba un banner en el dashboard ✅
- **Pero la sesión activa seguía funcionando** ❌

Si el dueño del negocio estaba logueado en el momento en que el admin lo suspendía, podía seguir operando — sumando puntos, canjeando recompensas, viendo clientes — hasta que cerrara el navegador o su token JWT expirara (hasta 30 días después).

### ¿Por qué importa?

En un sistema SaaS, la suspensión puede ocurrir por:
- Falta de pago
- Violación de términos de servicio
- Fraude detectado

Si la sesión activa no se invalida, el negocio puede seguir operando y causando daño (o simplemente usando el servicio sin pagar) durante horas o días.

### La solución correcta vs la solución implementada

**Solución ideal:** Invalidar el token JWT en el servidor. El problema es que Next Auth con la estrategia JWT no tiene lista negra de tokens por defecto — el token es válido hasta que expira porque no hay estado en el servidor.

Para invalidación inmediata de JWT necesitarías:
1. Cambiar a la estrategia `database` en NextAuth (guarda sesiones en la BD → puedes borrarlas).
2. O añadir una lista negra en Redis/base de datos y verificarla en cada request.

**Solución implementada (pragmática):** El layout del dashboard hace un fetch a `/api/businesses/me` al cargar. Si el negocio está suspendido, llama inmediatamente a `signOut()` y redirige a `/login?suspended=true`. El usuario ve un mensaje claro explicando qué pasó.

No es invalidación instantánea (si el usuario no navega a otra página, la sesión persiste), pero cubre el 95% de los casos con mínima complejidad.

### La regla

> **El estado de autorización debe verificarse en cada operación sensible, no solo al login.**

Es por eso que todos los endpoints de puntos, canje, y escaneo ya verifican `!card.program.business.isActive` y retornan 403. Aunque el usuario tenga sesión, las operaciones están bloqueadas en el servidor. La UI solo es la primera línea — el servidor es la última y la más importante.

---

## 6. Consistencia de IDs en Sistemas Externos

### ¿Qué era el problema?

Cuando se creaba un pase de Google Wallet, se guardaba en la base de datos:

```typescript
// ❌ Antes — guarda el ID interno de la tarjeta
await prisma.loyaltyCard.update({ data: { googlePassId: cardId } });
```

Pero el objeto real en Google Wallet tiene el ID:
```
{ISSUER_ID}.card_{cardId}
```

Eran IDs distintos. El campo `googlePassId` debería guardar el ID real del objeto en Google para poder referenciarlo directamente si fuera necesario.

### ¿Por qué importa?

Actualmente, `updateCardPoints` reconstruye el ID así:
```typescript
const objectId = `${ISSUER_ID}.card_${cardId}`;
```

Funciona porque la lógica de reconstrucción está duplicada en dos lugares. Pero si alguien cambia la fórmula del ID en un lugar y no en el otro, o si mañana necesitas hacer una consulta a Google para listar los pases de un usuario, el ID guardado en la BD no sirve.

### La regla

> **Cuando guardas un identificador de un sistema externo, guarda el identificador tal como lo conoce ese sistema externo.**

El campo `googlePassId` debe contener algo que puedas pasar directamente a la API de Google sin transformaciones. Lo mismo aplica para `applePassSerial` con el Pass Type Identifier completo.

### Lo que se hizo

```typescript
// ✅ Después — guarda el ID real del objeto en Google Wallet
const objectId = `${process.env.GOOGLE_WALLET_ISSUER_ID}.card_${cardId}`;
await prisma.loyaltyCard.update({ data: { googlePassId: objectId } });
```

---

## Resumen — Principios que debes memorizar

| Principio | Aplicación en este proyecto |
|---|---|
| **Nada de debug en producción** | Borrar endpoints antes de hacer deploy |
| **Zero Trust en inputs** | Validar y limitar TODOS los parámetros del cliente |
| **Consistencia en soft delete** | Si hay `isActive`, filtrar en TODOS los queries |
| **Headers de seguridad** | Configurar una vez en `next.config.ts`, protege toda la app |
| **Verificar autorización en el servidor** | El frontend es decoración; el backend es la ley |
| **IDs externos = IDs del sistema externo** | Guarda lo que la API externa espera recibir |

---

## ¿Qué sigue? (pendiente para futuras iteraciones)

- **Content Security Policy (CSP)** con nonces para Next.js
- **Rate limiting** en endpoints de login y operaciones de puntos (ej: max 10 req/min por IP con Upstash Redis)
- **Estrategia `database` en NextAuth** para poder invalidar sesiones inmediatamente
- **Notificaciones push reales** (el sistema las guarda pero no las envía — actualmente es un `TODO` en el código)
- **Índices de base de datos** en campos de búsqueda frecuente (`businessId`, `cardId`, `programId`)
