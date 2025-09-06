# Parcour Backend API

Backend API for a courier tracking and parcel management system built with Node.js, Express.js, TypeScript, and Prisma ORM.

## Features

- **Multi-role Authentication** - Customer, Agent, and Admin roles with JWT
- **Parcel Management** - CRUD operations for parcel booking and tracking
- **Real-time Tracking** - Socket.IO for live location updates
- **Agent Assignment** - Admin can assign parcels to delivery agents
- **Status Management** - Track parcel status through delivery lifecycle
- **Location Services** - Real-time agent location tracking
- **Role-based Access Control** - Secure API endpoints based on user roles

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type-safe JavaScript
- **PostgreSQL** - Database
- **Prisma** - Database ORM
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## Prerequisites

- Node.js (v18+)
- PostgreSQL (v12+)
- npm or yarn

## Installation

1. **Clone and install dependencies:**

```bash
git clone https://github.com/tasnimayan/parcour-backend.git
cd parcour-backend
npm install
```

2. **Set up environment variables:**
   Create a `.env` file:

```env
NODE_ENV=development
PORT=3000
API_VERSION=v1
DATABASE_URL="postgresql://username:password@localhost:5432/parcour_db"
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

3. **Set up database:**

```bash
# Run migrations
npm run prisma:generate
npm run prisma:migrate
```

4. **Start the server:**

```bash
npm run dev
```

Server runs on `http://localhost:8000`

## API Endpoints

Base URL: `http://localhost:8000/api/v1`

### Authentication

- `POST /auth/signup/customer` - Customer registration
- `POST /auth/signup/agent` - Agent registration
- `POST /auth/signup/admin` - Admin registration
- `POST /auth/login` - Universal login
- `POST /auth/logout` - Logout (Protected)
- `GET /auth/profile` - Get user profile (Protected)
- `GET /auth/session` - Get session user (Protected)

### Parcels

- `POST /parcel` - Create parcel (Customer only)
- `GET /parcel` - Get parcels with filters (All roles)
- `GET /parcel/stats` - Get parcel statistics (Admin only)
- `GET /parcel/customer/stats` - Get customer statistics (Customer only)
- `GET /parcel/:id` - Get parcel details (All roles)
- `PUT /parcel/:id` - Update parcel details (Customer only, PENDING status)
- `PATCH /parcel/:id/status` - Update status (Agent/Admin only)
- `DELETE /parcel/:id` - Delete parcel (Customer only, PENDING status)

### Tracking

- `GET /tracking/code/:trackingCode` - Track parcel by code (All roles)

### Admin

- `POST /admin/assign/agent` - Assign agent to parcel (Admin only)
- `GET /admin/agents` - Get agents list (Admin only)
- `GET /admin/users` - Get users list (Admin only)
- `GET /admin/stats/counts` - Dashboard statistics (Admin only)
- `PATCH /admin/users/status` - Update user status (Admin only)

### Agent

- `POST /agent/location` - Update agent location (Agent only)
- `GET /agent/stats` - Agent statistics (Agent only)

### Health Check

- `GET /health` - API health check
- `GET /` - API info

## Socket.IO Events

### Agent Events

- `agent:connect` - Agent connects for location sharing
- `agent:location-update` - Update agent location
- `location:updated` - Location update confirmation

### Customer Events

- `customer:track-parcel` - Start tracking a parcel
- `parcel:location-update` - Receive agent location updates
- `tracking:started` - Tracking session started

## Database Models

- **User** - Base user with roles (admin, agent, customer)
- **Customer** - Customer profile and addresses
- **Agent** - Agent profile and vehicle info
- **Parcel** - Parcel details and tracking
- **ParcelAssignment** - Agent-parcel assignments
- **AgentLocation** - Real-time location tracking
- **ParcelActivity** - Activity audit trail

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

## License

ISC License
