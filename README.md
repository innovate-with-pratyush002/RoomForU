# RoomForU

RoomForU is a full-stack room rental platform built for students who need to find rooms, PGs, or shared accommodations in other cities. Property owners can create accounts, publish listings with images and pricing details, and manage their properties from a personal profile page.

The project features a high-performance **Express REST API backend** and a modern **Next.js frontend**.

## Architecture & Tech Stack

### Backend
- **Node.js & Express 5**
- **MongoDB & Mongoose**: Connection pooling, lean querying, indexes, and pagination
- **Passport.js**: Local authentication and Google OAuth 2.0
- **Cloudinary & Multer**: Cloud media storage and upload limits
- **Security**: Helmet, CORS origin validation, rate limiting, and CSRF protection
- **Session**: `express-session` with MongoDB session store (`connect-mongo`)

### Frontend
- **Next.js 15 (App Router)**
- **React 19 & TypeScript**
- **Tailwind CSS v4 & Lucide Icons**
- **Interactive Maps**: Leaflet / OpenStreetMap

## Project Structure

```text
RoomForU/
├── app.js                      # Express API application entry point
├── cloudConfig.js              # Cloudinary configuration
├── controller/
│   └── api/
│       └── v1/                 # API controllers (auth, listings, profile)
├── middleware/                 # Security, rate limiting, and error handling
├── middleware.js               # Authentication & authorization guards
├── models/                     # Mongoose schemas (listing, review, user)
├── routes/
│   └── api/
│       └── v1/                 # REST API v1 routes & endpoints
├── utils/                      # Error & async wrappers
├── front-end/                  # Next.js frontend application
│   ├── app/                    # Next.js App Router pages
│   ├── components/             # Reusable UI components & maps
│   ├── lib/                    # API client, types, and utilities
│   └── public/                 # Static assets & images
└── init/                       # Database seed scripts
```

## Prerequisites

Before running locally, make sure you have:

- Node.js (v18+)
- MongoDB connection string (Atlas or local)
- Cloudinary credentials
- Google OAuth credentials (optional for Google login)

## Getting Started

### 1. Backend Setup

```bash
# Install backend dependencies
npm install

# Start backend on http://localhost:5000
npm start
```

### 2. Frontend Setup

```bash
cd front-end

# Install frontend dependencies
npm install

# Start Next.js development server on http://localhost:3000
npm run dev
```

## REST API Endpoints (`/api/v1`)

### Authentication & User
- `POST /api/v1/auth/signup` - Register a new user
- `POST /api/v1/auth/signin` - Authenticate with credentials
- `POST /api/v1/auth/logout` - Clear session and cookies
- `GET /api/v1/auth/current-user` - Get current session user
- `GET /api/v1/auth/google` - Initiate Google OAuth
- `GET /api/v1/profile` - Current user profile and listings

### Listings
- `GET /api/v1/listings` - Search and list accommodations (supports filters, pagination, sort)
- `GET /api/v1/listings/:id` - Accommodation details with reviews and owner
- `POST /api/v1/listings` - Create a listing (multipart form with image & coordinates)
- `PUT /api/v1/listings/:id` - Update listing details
- `DELETE /api/v1/listings/:id` - Remove listing and clean up Cloudinary images

### Reviews
- `POST /api/v1/listings/:id/reviews` - Add a review with rating
- `DELETE /api/v1/listings/:id/reviews/:reviewId` - Delete review (owner only)

## License

This project is licensed under the `MIT` license. See [`LICENSE`](./LICENSE).
