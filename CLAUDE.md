# LoyaltyWallet — Sistema de tarjetas de fidelidad digital

## Visión general

LoyaltyWallet es una plataforma SaaS que permite a negocios locales (cafeterías, barberías, restaurantes, farmacias, lavanderías, etc.) crear programas de lealtad digitales usando tarjetas integradas con Google Wallet y Apple Wallet. Los clientes finales no necesitan descargar ninguna app — la tarjeta vive directamente en su wallet nativo.

El sistema se monetiza cobrando una suscripción mensual a cada negocio ($299–$500 MXN/mes) más un setup inicial ($1,500–$2,000 MXN). El mercado objetivo inicial es la ciudad de Tepic, Nayarit, México.

---

## Stack tecnológico

- **Framework**: Next.js (App Router) — fullstack (frontend + API routes en un solo proyecto)
- **Base de datos**: PostgreSQL
- **ORM/Query builder**: Prisma
- **Autenticación**: NextAuth.js con JWT
- **Estilos**: Tailwind CSS
- **Wallet APIs**: Google Wallet API (Loyalty Cards) + Apple PassKit (.pkpass)
- **QR**: Librería `qrcode` para generar QR codes
- **Escáner QR**: `html5-qrcode` para escanear desde la cámara del cajero
- **Hosting**: Vercel (frontend + API serverless) + Oracle Cloud VM ARM (PostgreSQL + cron jobs)
- **Dominio**: Propio, con SSL via Let's Encrypt en la VM
- **Lenguaje**: TypeScript

---

## Arquitectura

```
┌─────────────────────────────────────────────────┐
│  Frontend + API (Next.js en Vercel)              │
│                                                   │
│  /app                                             │
│  ├── (auth)/login, register     → Auth pages      │
│  ├── dashboard/                 → Panel admin      │
│  │   ├── overview               → Stats generales  │
│  │   ├── customers              → Lista clientes   │
│  │   ├── scan                   → Escáner QR       │
│  │   ├── rewards                → Recompensas      │
│  │   ├── notifications          → Envío push       │
│  │   └── settings               → Config negocio   │
│  ├── r/[slug]                   → Registro público  │
│  └── api/                       → API Routes        │
│      ├── auth/                  → NextAuth          │
│      ├── businesses/            → CRUD negocios     │
│      ├── customers/             → Registro + query  │
│      ├── cards/                 → Puntos + canje    │
│      ├── rewards/               → CRUD recompensas  │
│      ├── wallet/                → Google + Apple     │
│      ├── notifications/         → Push + geo        │
│      └── scan/                  → Procesar QR scan  │
│                                                   │
└───────────────┬─────────────────┬─────────────────┘
                │                 │
                ▼                 ▼
    ┌───────────────┐   ┌─────────────────┐
    │  PostgreSQL    │   │ Servicios ext.  │
    │  (Oracle VM)   │   │ Google Wallet   │
    │                │   │ Apple PassKit   │
    └───────────────┘   └─────────────────┘
```

---

## Estructura del proyecto

```
loyalty-wallet/
├── prisma/
│   ├── schema.prisma          # Esquema de la BD
│   └── seed.ts                # Datos de prueba
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── dashboard/
│   │   │   ├── layout.tsx          # Sidebar + header
│   │   │   ├── page.tsx            # Overview/stats
│   │   │   ├── customers/page.tsx
│   │   │   ├── scan/page.tsx       # Escáner QR del cajero
│   │   │   ├── rewards/page.tsx
│   │   │   ├── notifications/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── r/
│   │   │   └── [slug]/page.tsx     # Formulario registro público
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── businesses/route.ts
│   │   │   ├── customers/route.ts
│   │   │   ├── cards/
│   │   │   │   ├── route.ts
│   │   │   │   ├── [cardId]/points/route.ts
│   │   │   │   └── [cardId]/redeem/route.ts
│   │   │   ├── rewards/route.ts
│   │   │   ├── wallet/
│   │   │   │   ├── google/route.ts
│   │   │   │   └── apple/route.ts
│   │   │   ├── notifications/route.ts
│   │   │   └── scan/route.ts
│   │   ├── layout.tsx
│   │   └── page.tsx                # Landing page
│   ├── components/
│   │   ├── ui/                     # Componentes reutilizables
│   │   ├── dashboard/              # Componentes del panel
│   │   ├── forms/                  # Formularios
│   │   └── scan/                   # Escáner QR
│   ├── lib/
│   │   ├── prisma.ts               # Instancia Prisma
│   │   ├── auth.ts                 # Config NextAuth
│   │   ├── google-wallet.ts        # Servicio Google Wallet API
│   │   ├── apple-wallet.ts         # Servicio Apple PassKit
│   │   ├── notifications.ts        # Servicio de notificaciones
│   │   └── qr.ts                   # Generador/parser de QR
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useScanner.ts
│   └── types/
│       └── index.ts                # Tipos TypeScript
├── public/
│   └── images/
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Esquema de base de datos (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Business {
  id              String   @id @default(uuid())
  name            String
  slug            String   @unique
  category        String   // cafeteria, barberia, restaurante, etc.
  description     String?
  logoUrl         String?  @map("logo_url")
  phone           String?
  email           String?
  latitude        Decimal?
  longitude       Decimal?
  geoRadiusMeters Int      @default(200) @map("geo_radius_meters")
  address         String?
  city            String?
  isActive        Boolean  @default(true) @map("is_active")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  users           BusinessUser[]
  loyaltyPrograms LoyaltyProgram[]
  notifications   Notification[]

  @@map("businesses")
}

model BusinessUser {
  id           String   @id @default(uuid())
  businessId   String   @map("business_id")
  name         String
  email        String   @unique
  passwordHash String   @map("password_hash")
  role         String   @default("admin") // admin, cashier
  createdAt    DateTime @default(now()) @map("created_at")

  business     Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  transactions Transaction[] @relation("CreatedByUser")
  redemptions  RewardRedemption[] @relation("RedeemedByUser")

  @@map("business_users")
}

model Customer {
  id        String   @id @default(uuid())
  name      String
  email     String?
  phone     String
  createdAt DateTime @default(now()) @map("created_at")

  loyaltyCards LoyaltyCard[]

  @@unique([phone])
  @@map("customers")
}

model LoyaltyProgram {
  id               String   @id @default(uuid())
  businessId       String   @map("business_id")
  name             String
  pointsPerVisit   Int      @default(1) @map("points_per_visit")
  pointsPerCurrency Int     @default(0) @map("points_per_currency") // puntos por cada peso gastado
  cardBgColor      String   @default("#1a1a2e") @map("card_bg_color")
  cardTextColor    String   @default("#ffffff") @map("card_text_color")
  cardLogoUrl      String?  @map("card_logo_url")
  isActive         Boolean  @default(true) @map("is_active")
  createdAt        DateTime @default(now()) @map("created_at")

  business         Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  rewards          Reward[]
  loyaltyCards     LoyaltyCard[]

  @@map("loyalty_programs")
}

model LoyaltyCard {
  id                String   @id @default(uuid())
  customerId        String   @map("customer_id")
  programId         String   @map("program_id")
  currentPoints     Int      @default(0) @map("current_points")
  totalPointsEarned Int      @default(0) @map("total_points_earned")
  totalVisits       Int      @default(0) @map("total_visits")
  qrCodeData        String   @unique @map("qr_code_data") // string codificado en el QR de la tarjeta wallet
  googlePassId      String?  @map("google_pass_id")
  applePassSerial   String?  @map("apple_pass_serial")
  lastVisit         DateTime? @map("last_visit")
  createdAt         DateTime @default(now()) @map("created_at")

  customer          Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  program           LoyaltyProgram @relation(fields: [programId], references: [id], onDelete: Cascade)
  transactions      Transaction[]
  redemptions       RewardRedemption[]

  @@unique([customerId, programId])
  @@map("loyalty_cards")
}

model Reward {
  id              String   @id @default(uuid())
  programId       String   @map("program_id")
  name            String
  description     String?
  pointsRequired  Int      @map("points_required")
  rewardType      String   @default("discount") @map("reward_type") // discount, freebie, upgrade
  maxRedemptions  Int?     @map("max_redemptions") // null = ilimitado
  isActive        Boolean  @default(true) @map("is_active")
  createdAt       DateTime @default(now()) @map("created_at")

  program         LoyaltyProgram @relation(fields: [programId], references: [id], onDelete: Cascade)
  redemptions     RewardRedemption[]

  @@map("rewards")
}

model Transaction {
  id          String   @id @default(uuid())
  cardId      String   @map("card_id")
  type        String   // earn, redeem, adjust
  points      Int      // positivo = ganados, negativo = gastados
  amountSpent Decimal? @map("amount_spent") // monto de la compra (opcional)
  description String?
  createdById String   @map("created_by")
  createdAt   DateTime @default(now()) @map("created_at")

  card        LoyaltyCard @relation(fields: [cardId], references: [id], onDelete: Cascade)
  createdBy   BusinessUser @relation("CreatedByUser", fields: [createdById], references: [id])

  @@map("transactions")
}

model RewardRedemption {
  id          String   @id @default(uuid())
  cardId      String   @map("card_id")
  rewardId    String   @map("reward_id")
  pointsSpent Int      @map("points_spent")
  redeemedById String  @map("redeemed_by")
  createdAt   DateTime @default(now()) @map("created_at")

  card        LoyaltyCard @relation(fields: [cardId], references: [id], onDelete: Cascade)
  reward      Reward @relation(fields: [rewardId], references: [id])
  redeemedBy  BusinessUser @relation("RedeemedByUser", fields: [redeemedById], references: [id])

  @@map("reward_redemptions")
}

model Notification {
  id          String    @id @default(uuid())
  businessId  String    @map("business_id")
  title       String
  message     String
  type        String    @default("push") // push, geo, scheduled
  status      String    @default("draft") // draft, scheduled, sent
  sentCount   Int       @default(0) @map("sent_count")
  openedCount Int       @default(0) @map("opened_count")
  scheduledAt DateTime? @map("scheduled_at")
  sentAt      DateTime? @map("sent_at")
  createdAt   DateTime  @default(now()) @map("created_at")

  business    Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  @@map("notifications")
}
```

---

## Flujos principales del sistema

### Flujo 1: Registro del negocio (onboarding)

1. Dueño del negocio entra a `/register`
2. Llena formulario: nombre, correo, contraseña
3. Se crea el `BusinessUser` (rol: admin) y el `Business` (con slug auto-generado)
4. Se redirige al dashboard `/dashboard/settings` para completar:
   - Logo, dirección, coordenadas GPS, categoría, teléfono
5. Configura su programa de lealtad en `/dashboard/rewards`:
   - Puntos por visita y/o por peso gastado
   - Colores y logo de la tarjeta wallet
   - Crea las recompensas con sus costos en puntos
6. El sistema genera automáticamente:
   - URL pública de registro: `/r/{slug}` (ej: `/r/cafeteria-lupita`)
   - Código QR descargable que apunta a esa URL

### Flujo 2: Registro del cliente final

1. Cliente escanea el QR en el mostrador o recibe el link por WhatsApp
2. Abre `/r/{slug}` — ve el formulario con el logo y nombre del negocio
3. Llena: nombre, teléfono, correo (opcional)
4. Sistema verifica si el `Customer` ya existe (por teléfono):
   - Si existe: solo crea nueva `LoyaltyCard` vinculada al programa
   - Si no existe: crea `Customer` + `LoyaltyCard`
5. Se genera un `qrCodeData` único para la tarjeta (formato: `LW:{cardId}`)
6. Se muestra botón "Agregar a Google Wallet" y/o "Agregar a Apple Wallet"
7. Al tocar:
   - **Google Wallet**: se llama a la API para crear un Loyalty Object con el QR, puntos, y coordenadas GPS del negocio
   - **Apple Wallet**: se genera un archivo .pkpass con la misma info y se descarga
8. La tarjeta queda en el wallet del cliente con:
   - Logo y nombre del negocio
   - Puntos actuales
   - QR code con su `qrCodeData`
   - Coordenadas GPS para notificaciones de proximidad

### Flujo 3: Sumar puntos (operación diaria del cajero)

1. Cliente muestra su tarjeta wallet en su teléfono (el QR es visible)
2. Cajero abre `/dashboard/scan` en su dispositivo
3. Se activa la cámara y escanea el QR del cliente
4. El QR contiene `LW:{cardId}` — el sistema busca la tarjeta
5. Aparece la pantalla del cliente con:
   - Nombre del cliente
   - Puntos actuales
   - Botón "Sumar puntos" y campo para cantidad
   - Opcionalmente: monto de la compra (si usa puntos por peso)
6. Cajero ingresa los puntos (o el monto) y confirma
7. Se crea un `Transaction` (type: "earn")
8. Se actualizan `currentPoints`, `totalPointsEarned`, `totalVisits`, `lastVisit`
9. Se actualiza la tarjeta en Google/Apple Wallet en tiempo real
10. El cliente ve los puntos actualizados en su wallet sin hacer nada

### Flujo 4: Canjear recompensa

1. Cliente dice al cajero "quiero canjear mi recompensa"
2. Cajero escanea el QR del cliente (mismo flujo que sumar puntos)
3. Aparece la pantalla del cliente con las recompensas disponibles:
   - Solo muestra recompensas que el cliente puede pagar con sus puntos actuales
4. Cajero selecciona la recompensa y confirma el canje
5. Se valida que:
   - El cliente tiene suficientes puntos
   - La recompensa está activa
   - No se excede `maxRedemptions` (si aplica)
6. Se crea un `RewardRedemption` y un `Transaction` (type: "redeem", puntos negativos)
7. Se descuentan los puntos de `currentPoints`
8. Se actualiza la tarjeta en el wallet del cliente

### Flujo 5: Notificaciones

**Push manual (desde dashboard):**
1. Dueño va a `/dashboard/notifications`
2. Escribe título y mensaje
3. Elige: enviar ahora o programar para después
4. El sistema envía push notification a todas las tarjetas wallet de sus clientes
5. Se crea `Notification` con status y métricas

**Geolocalización (automática):**
1. Al crear la tarjeta wallet, se incluyen las coordenadas GPS del negocio y el radio
2. Cuando el teléfono del cliente entra en ese radio, el SO (iOS/Android) dispara una notificación automática en la pantalla de bloqueo
3. Esta funcionalidad es nativa de Google/Apple Wallet — no requiere código del lado del servidor

---

## API Routes — Endpoints principales

### Auth
- `POST /api/auth/register` — Registro de nuevo negocio
- `POST /api/auth/[...nextauth]` — Login con NextAuth (credentials provider)

### Businesses
- `GET /api/businesses/me` — Datos del negocio del usuario autenticado
- `PUT /api/businesses/me` — Actualizar datos del negocio
- `GET /api/businesses/[slug]/public` — Info pública (para formulario de registro)

### Customers
- `GET /api/customers` — Lista de clientes del negocio (con paginación y búsqueda)
- `POST /api/customers/register` — Registro público de cliente (desde `/r/{slug}`)
- `GET /api/customers/[customerId]` — Detalle de un cliente

### Cards
- `GET /api/cards` — Todas las tarjetas del programa del negocio
- `POST /api/cards/[cardId]/points` — Sumar puntos
- `POST /api/cards/[cardId]/redeem` — Canjear recompensa

### Scan
- `POST /api/scan` — Recibe `qrCodeData`, devuelve datos del cliente + puntos + recompensas disponibles

### Rewards
- `GET /api/rewards` — Lista de recompensas del programa
- `POST /api/rewards` — Crear recompensa
- `PUT /api/rewards/[rewardId]` — Editar recompensa
- `DELETE /api/rewards/[rewardId]` — Eliminar recompensa

### Wallet
- `POST /api/wallet/google` — Generar link de Google Wallet pass
- `POST /api/wallet/apple` — Generar archivo .pkpass
- `POST /api/wallet/update/[cardId]` — Actualizar pass después de cambio de puntos

### Notifications
- `GET /api/notifications` — Historial de notificaciones
- `POST /api/notifications` — Crear y enviar notificación
- `GET /api/notifications/stats` — Métricas de apertura

### Dashboard Stats
- `GET /api/stats/overview` — Total clientes, visitas hoy, puntos canjeados, etc.
- `GET /api/stats/activity` — Actividad reciente (últimas transacciones)
- `GET /api/stats/retention` — Tasa de retorno de clientes

---

## Roles y permisos

### Admin (dueño del negocio)
- Acceso completo al dashboard
- Configurar negocio y programa de lealtad
- Crear/editar/eliminar recompensas
- Enviar notificaciones
- Ver estadísticas
- Agregar usuarios cajero
- Sumar puntos y canjear recompensas

### Cajero (empleado)
- Acceso solo a: escáner QR, sumar puntos, canjear recompensas
- NO puede: configurar negocio, editar recompensas, enviar notificaciones, ver stats completas

---

## Formato del QR Code

El QR integrado en la tarjeta wallet contiene un string con formato:

```
LW:{cardId}
```

Ejemplo: `LW:550e8400-e29b-41d4-a716-446655440000`

El prefijo `LW:` identifica que es un QR de LoyaltyWallet y no cualquier otro QR. Al escanear, el endpoint `/api/scan` parsea el string, extrae el `cardId`, y devuelve la información del cliente.

---

## Variables de entorno (.env)

```env
# Base de datos
DATABASE_URL="postgresql://user:password@host:5432/loyaltywallet"

# NextAuth
NEXTAUTH_SECRET="tu-secret-aqui"
NEXTAUTH_URL="https://tudominio.com"

# Google Wallet
GOOGLE_WALLET_ISSUER_ID="issuer-id"
GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL="email@project.iam.gserviceaccount.com"
GOOGLE_WALLET_SERVICE_ACCOUNT_KEY="path/to/key.json"

# Apple Wallet
APPLE_PASS_TYPE_ID="pass.com.tudominio.loyalty"
APPLE_TEAM_ID="XXXXXXXXXX"
APPLE_CERT_PATH="path/to/certificate.pem"
APPLE_KEY_PATH="path/to/key.pem"
APPLE_KEY_PASSPHRASE="passphrase"

# App
NEXT_PUBLIC_APP_URL="https://tudominio.com"
NEXT_PUBLIC_APP_NAME="LoyaltyWallet"
```

---

## Reglas de negocio importantes

1. **Un cliente = un teléfono**: El teléfono es el identificador único del cliente. Si se registra en dos negocios diferentes, se crean dos `LoyaltyCard` pero un solo `Customer`.

2. **Puntos nunca negativos**: `currentPoints` nunca puede bajar de 0. Validar antes de canjear.

3. **QR único por tarjeta**: Cada `LoyaltyCard` tiene un `qrCodeData` único generado al momento del registro.

4. **Actualización en tiempo real**: Cada vez que se suman o restan puntos, se debe llamar a la API de Google/Apple Wallet para actualizar el pass del cliente.

5. **Slug único por negocio**: El slug se genera automáticamente del nombre del negocio (ej: "Cafetería Lupita" → "cafeteria-lupita"). Si ya existe, se agrega un sufijo numérico.

6. **Soft delete**: Los negocios y programas no se eliminan, se desactivan con `isActive = false`.

7. **Trazabilidad**: Toda transacción registra quién la procesó (`createdBy`). Esto es para auditoría y para saber qué cajero está trabajando.

8. **Geofencing**: El radio de geolocalización se configura por negocio. Default: 200 metros. Esto se envía como metadata en el wallet pass.

---

## Convenciones de código

- **TypeScript estricto**: `strict: true` en tsconfig
- **Naming**: camelCase en código, snake_case en la BD (Prisma mapea con `@map`)
- **Componentes**: Server Components por defecto, Client Components solo cuando necesiten interactividad (escáner QR, formularios con estado)
- **Validación**: Zod para validar inputs en API routes
- **Errores**: Respuestas consistentes `{ success: boolean, data?: any, error?: string }`
- **Autenticación**: Middleware de NextAuth en todas las rutas del dashboard y API (excepto las públicas: registro de cliente, info pública del negocio)

---

## Dependencias principales

```json
{
  "dependencies": {
    "next": "latest",
    "@prisma/client": "latest",
    "prisma": "latest",
    "next-auth": "latest",
    "bcryptjs": "latest",
    "zod": "latest",
    "qrcode": "latest",
    "html5-qrcode": "latest",
    "google-auth-library": "latest",
    "passkit-generator": "latest",
    "@tailwindcss/forms": "latest",
    "recharts": "latest",
    "date-fns": "latest",
    "slugify": "latest"
  }
}
```

---

## Notas de infraestructura

- **Vercel**: Hostea el proyecto Next.js completo (frontend + API routes como serverless functions)
- **Oracle Cloud VM (ARM free tier)**: Corre PostgreSQL y un cron job pequeño para notificaciones programadas
- **Conexión**: Vercel se conecta a PostgreSQL en la VM de Oracle via la IP pública + puerto 5432 con SSL
- **Backups**: Cron job diario que hace `pg_dump` y sube a Oracle Object Storage (gratuito)
- **Dominio**: Propio (~$150–200 MXN/año), DNS apuntando a Vercel
