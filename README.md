# Trustap Escrow Payment System

A complete **Escrow-Based Payment System** built with **NestJS** and **Prisma ORM**, powered by the **Trustap API**. This system enables secure peer-to-peer transactions where funds are held in escrow until the buyer confirms delivery.

---

## 🏗️ Tech Stack

| Technology | Purpose |
|---|---|
| **NestJS** | Backend framework (Node.js) |
| **Prisma ORM v7** | Database ORM with PostgreSQL |
| **PostgreSQL** | Database |
| **Trustap API** | Escrow payment processing |
| **Swagger/OpenAPI** | API documentation |
| **class-validator** | DTO validation |
| **@nestjs/axios** | HTTP client for Trustap API calls |

---

## 📁 Project Structure

```
prisma/
└── schema.prisma          # Database models
prisma.config.ts           # Prisma v7 configuration

src/
├── prisma/
│   ├── prisma.module.ts   # Global Prisma module
│   └── prisma.service.ts  # Prisma client service (pg adapter)
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── dto/
│       └── create-user.dto.ts
├── escrow/
│   ├── escrow.module.ts
│   ├── escrow.controller.ts
│   ├── escrow.service.ts
│   └── dto/
│       ├── create-transaction.dto.ts
│       └── dispute.dto.ts
├── webhook/
│   ├── webhook.module.ts
│   ├── webhook.controller.ts
│   └── webhook.service.ts
├── common/
│   └── trustap.config.ts  # Trustap API config helper
├── app.module.ts
├── app.controller.ts
├── app.service.ts
└── main.ts

.env.example               # Example environment variables
```

---

## ✅ Prerequisites

- Node.js >= 18.x
- PostgreSQL database
- Trustap API key (get one at https://trustap.com)

---

## 🚀 Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd trustap-escrow-payment

# 2. Install dependencies
npm install

# 3. Copy and configure environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and TRUSTAP_API_KEY

# 4. Generate Prisma client
npm run prisma:generate

# 5. Run database migrations
npm run prisma:migrate

# 6. Start the development server
npm run start:dev
```

---

## ⚙️ Environment Variables

Create a `.env` file based on `.env.example`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/trustap_escrow
TRUSTAP_API_KEY=your_trustap_api_key_here
TRUSTAP_BASE_URL=https://sandbox-api.trustap.com
TRUSTAP_REDIRECT_URI=http://localhost:3000/payment/success
JWT_SECRET=your_jwt_secret_here
PORT=3000
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `TRUSTAP_API_KEY` | Your Trustap API key |
| `TRUSTAP_BASE_URL` | Trustap API base URL (sandbox or production) |
| `TRUSTAP_REDIRECT_URI` | Redirect URI after payment completion |
| `JWT_SECRET` | JWT signing secret |
| `PORT` | Server port (default: 3000) |

---

## 🗄️ Database Setup

```bash
# Generate Prisma client from schema
npm run prisma:generate
# or: npx prisma generate

# Run migrations (creates tables in your PostgreSQL database)
npm run prisma:migrate
# or: npx prisma migrate dev --name init

# Open Prisma Studio (visual database browser)
npm run prisma:studio
# or: npx prisma studio
```

---

## 📖 API Endpoints

### 🔗 Swagger Documentation
Visit **http://localhost:3000/api/docs** for interactive API docs.

---

### 👤 Users

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/users` | Register a new user (Buyer or Seller) |
| `GET` | `/users` | Get all users |
| `GET` | `/users/:id` | Get a user by ID with their transactions |

**Register User Example:**
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "buyer@example.com",
    "name": "John Doe",
    "country": "IE"
  }'
```

---

### 💰 Escrow Transactions

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/escrow/transaction` | Create a new escrow transaction |
| `GET` | `/escrow/transaction/:id` | Get transaction status and details |
| `GET` | `/escrow/transactions` | List all escrow transactions |
| `GET` | `/escrow/payment-link/:id` | Get the buyer payment URL |
| `GET` | `/escrow/charge?currency=EUR&price=150` | Calculate Trustap escrow fee |
| `POST` | `/escrow/release/:id` | Release funds to seller |
| `POST` | `/escrow/dispute/:id` | Raise a dispute on a transaction |
| `GET` | `/escrow/balance` | Get Trustap account balance |

**Create Transaction Example:**
```bash
curl -X POST http://localhost:3000/escrow/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "buyerId": "uuid-of-buyer",
    "sellerId": "uuid-of-seller",
    "amount": 150.00,
    "currency": "EUR",
    "description": "Payment for used iPhone 13"
  }'
```

**Release Funds Example:**
```bash
curl -X POST http://localhost:3000/escrow/release/<transaction-id>
```

**Raise Dispute Example:**
```bash
curl -X POST http://localhost:3000/escrow/dispute/<transaction-id> \
  -H "Content-Type: application/json" \
  -d '{"reason": "Item was not as described"}'
```

---

### 🔔 Webhook

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/webhook/trustap` | Trustap webhook receiver |

**Configure this URL in your Trustap Dashboard** to receive real-time payment events.

**Supported Events:**
| Event | Status Update |
|---|---|
| `payment.received` | `PAYMENT_RECEIVED` |
| `escrow.funded` | `IN_ESCROW` |
| `transaction.completed` | `COMPLETED` |
| `dispute.raised` | `DISPUTED` |
| `funds.released` | `FUNDS_RELEASED` |
| `refund.issued` | `REFUNDED` |
| `transaction.cancelled` | `CANCELLED` |

---

## 🔄 Escrow Payment Flow

```
1. REGISTER USERS
   POST /users → Create buyer and seller accounts
   (Registers them on Trustap as guest_users)

2. CREATE TRANSACTION
   POST /escrow/transaction → Creates escrow transaction
   Returns: paymentUrl for the buyer

3. BUYER PAYMENT
   Buyer visits paymentUrl and completes payment
   Funds are held in Trustap's escrow

4. WEBHOOK EVENTS
   Trustap sends real-time events to POST /webhook/trustap
   Status automatically updated in database

5. DELIVERY & CONFIRMATION
   Seller delivers goods/services
   Buyer confirms receipt

6. RELEASE FUNDS
   POST /escrow/release/:id → Buyer releases funds to seller
   Transaction marked as FUNDS_RELEASED

7. DISPUTE (if needed)
   POST /escrow/dispute/:id → Either party raises a dispute
   Trustap mediates and resolves
```

---

## 🔒 Transaction Statuses

| Status | Description |
|---|---|
| `PENDING` | Transaction created, awaiting payment |
| `PAYMENT_RECEIVED` | Payment received from buyer |
| `IN_ESCROW` | Funds held in escrow |
| `COMPLETED` | Transaction completed |
| `DISPUTED` | Dispute raised |
| `FUNDS_RELEASED` | Funds released to seller |
| `REFUNDED` | Funds refunded to buyer |
| `CANCELLED` | Transaction cancelled |

---

## 🏗️ Build for Production

```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm run start
```

---

## 🧪 Sandbox Mode

When `TRUSTAP_BASE_URL=https://sandbox-api.trustap.com`, the system runs in sandbox mode:
- If Trustap API calls fail, mock transaction IDs are generated (`mock_<timestamp>`)
- Fee calculations return estimated values
- Balance returns mock zero values

This allows development and testing without a real Trustap account.

---

## 📊 Database Models

### User
Stores buyer and seller information, linked to Trustap guest user IDs.

### EscrowTransaction
Tracks all escrow transactions with status, payment URLs, and dispute information.

### WebhookEvent
Audit log of all webhook events received from Trustap.
