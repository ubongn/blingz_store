# BlingzStore

A full-stack ecommerce web application for selling women's hair products, organic honey, and plantain chips. Built with React, Express, and PostgreSQL.

**Live Demo:** [blingzstore.com](https://blingzstore.com)

## Tech Stack

**Frontend:**
- React 19 + Vite
- Tailwind CSS 4
- React Router 7
- Stripe React Elements
- react-icons (Feather Icons)
- react-helmet-async (SEO)
- react-hot-toast (notifications)

**Backend:**
- Express.js
- PostgreSQL (via `pg`)
- JWT authentication (HS256, 7-day expiry)
- bcrypt password hashing (12 rounds)
- Multer (file uploads)
- Nodemailer (email notifications)
- Helmet (security headers)
- express-rate-limit (rate limiting)
- morgan (HTTP logging)
- express-validator (input validation)
- xss (sanitization)

**Payment:**
- Stripe (Nigerian Naira)

**DevOps:**
- Docker + Docker Compose
- GitHub Actions CI (lint + build)
- PostgreSQL 16

## Features

### Shopping
- Product browsing with search, category filtering, sort, and price range
- Product detail pages with image gallery and customer reviews
- Shopping cart with quantity controls and stock validation
- Checkout with Stripe payment (card confirmation in-page)
- Coupon codes with auto-apply suggestions
- Responsive design (mobile, tablet, desktop)

### User Account
- Signup and login with JWT authentication
- User profile with avatar upload
- Wishlist (save products for later)
- Order history with status tracking
- Order cancellation (Processing orders only, stock restored)
- Password reset flow (forgot + reset)
- Notification preferences

### Admin Panel
- Dashboard with stats (revenue, orders, users, products)
- Product management (CRUD with image upload + gallery)
- Order management (status updates: Processing → Shipped → Delivered)
- User management (view users, toggle admin role)
- Coupon management (percentage/fixed discounts, expiry, usage limits)
- Low stock alerts

### Notifications
- In-app notification bell with unread count badge
- Notification polling every 30 seconds with toast popup
- Email notifications: welcome, order confirmation, shipping, delivery

### Security
- Helmet security headers (X-Frame-Options, CSP, HSTS, etc.)
- Rate limiting: general (100/15min), auth (10/15min), checkout (20/15min)
- Input validation with express-validator on all endpoints
- XSS sanitization with `xss` library
- Login lockout after 5 failed attempts (15-minute window)
- Server-side amount verification (no client-trusted prices)
- Stripe webhook signature verification
- JWT pinned to HS256 algorithm
- Fail-fast environment validation on startup

### SEO
- Dynamic page titles and meta descriptions (react-helmet-async)
- Open Graph tags for social sharing
- Default meta tags in index.html

## Project Structure

```
blingz_store/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── Navbar.jsx         # Navigation with cart, notifications, user menu
│   │   │   ├── Footer.jsx         # Site footer
│   │   │   ├── ProductCard.jsx    # Product card with wishlist toggle
│   │   │   ├── PasswordInput.jsx  # Password input with show/hide toggle
│   │   │   ├── ScrollToTop.jsx    # Scroll to top on route change
│   │   │   ├── Skeleton.jsx       # Loading skeleton components
│   │   │   ├── ErrorBoundary.jsx  # Error boundary with retry
│   │   │   └── ProtectedRoute.jsx # Auth + admin route guards
│   │   ├── pages/             # Route pages (lazy-loaded)
│   │   │   ├── Home.jsx           # Hero, categories, products, testimonials
│   │   │   ├── ProductDetail.jsx  # Product info, gallery, reviews
│   │   │   ├── Cart.jsx           # Shopping cart
│   │   │   ├── Checkout.jsx       # Shipping + Stripe payment + coupons
│   │   │   ├── OrderConfirmation.jsx
│   │   │   ├── OrderHistory.jsx   # User's orders list
│   │   │   ├── OrderDetail.jsx    # Order tracking + cancel
│   │   │   ├── Wishlist.jsx       # Saved products
│   │   │   ├── Profile.jsx        # Edit name + avatar upload
│   │   │   ├── Settings.jsx       # Change password + notification prefs
│   │   │   ├── Login.jsx          # Login form
│   │   │   ├── Signup.jsx         # Registration form
│   │   │   ├── ForgotPassword.jsx # Request reset link
│   │   │   ├── ResetPassword.jsx  # Submit new password
│   │   │   ├── About.jsx          # About page
│   │   │   ├── Contact.jsx        # Contact page
│   │   │   ├── AdminDashboard.jsx # Admin stats overview
│   │   │   ├── AdminProducts.jsx  # Product CRUD + image gallery
│   │   │   ├── AdminOrders.jsx    # Order management
│   │   │   ├── AdminUsers.jsx     # User management
│   │   │   └── AdminCoupons.jsx   # Coupon CRUD
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Auth state, cart, notifications
│   │   ├── api.js             # Fetch wrapper with JWT header
│   │   ├── main.jsx           # App entry with providers
│   │   └── App.jsx            # Route definitions
│   ├── index.html
│   └── package.json
│
├── server/                    # Express backend
│   ├── routes/
│   │   ├── auth.js            # Signup, login, profile, password reset
│   │   ├── products.js        # Product listing, detail, reviews
│   │   ├── cart.js            # Cart CRUD
│   │   ├── checkout.js        # Stripe + coupon validation + order placement
│   │   ├── orders.js          # Order history + cancellation
│   │   ├── wishlist.js        # Wishlist CRUD
│   │   ├── notifications.js   # Notification listing + read
│   │   └── admin.js           # Admin CRUD + dashboard stats + image uploads
│   ├── middleware/
│   │   ├── auth.js            # JWT verification (HS256)
│   │   ├── admin.js           # Admin role check
│   │   ├── security.js        # Helmet + CORS + rate limiting
│   │   ├── validate.js        # express-validator chains
│   │   ├── validateEnv.js     # Fail-fast env validation
│   │   └── errorHandler.js    # Global error handler + 404
│   ├── config.js              # Centralized env config
│   ├── utils/
│   │   └── email.js           # Nodemailer + email templates
│   ├── uploads/               # Uploaded images (gitignored)
│   ├── db.js                  # PostgreSQL schema + Pool + seed data
│   ├── app.js                 # Express app (no startup)
│   ├── index.js               # Server entry + DB init + seed
│   ├── .env                   # Environment variables
│   └── package.json
│
├── Dockerfile                 # Multi-stage Docker build
├── docker-compose.yml         # PostgreSQL + server
├── .dockerignore              # Docker ignore rules
├── .github/workflows/ci.yml   # CI: lint + build
├── LICENSE                    # MIT License
└── README.md
```

## Getting Started

### Prerequisites
- Node.js v18+
- PostgreSQL 16+ (or Docker)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/ubongn/blingz_store.git
cd blingz_store

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Environment Variables

Create `server/.env`:

```env
# Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/blingzstore

# Auth
JWT_SECRET=your-random-secret-key-min-32-chars

# Stripe (test keys)
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# CORS
CORS_ORIGIN=http://localhost:3000
CLIENT_URL=http://localhost:3000
BASE_URL=http://localhost:5000

# Email (SMTP) — optional, logs to console if not configured
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=BlingzStore <noreply@blingzstore.com>

# Admin (auto-seeded on first run)
ADMIN_EMAIL=admin@blingzstore.com
ADMIN_PASSWORD=admin123

NODE_ENV=development
PORT=5000
```

Create `client/.env`:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
VITE_API_URL=http://localhost:5000
```

### Running

```bash
# Terminal 1 — Backend (port 5000)
cd server
npm run dev

# Terminal 2 — Frontend (port 3000)
cd client
npm run dev
```

### Docker

```bash
# Start PostgreSQL + server
docker compose up -d

# Build client for production
cd client && npm run build

# Copy build to server/public for Docker serving
cp -r dist ../server/public
```

The database is created automatically on first run with sample products and admin user.

## Admin Access

| Email | Password |
|-------|----------|
| admin@blingzstore.com | admin123 |

Admin users see the Dashboard, Products, Orders, Coupons, and Users links in the navbar. Regular users see Home, Cart, Orders, and Wishlist.

## API Endpoints

### Auth (`/api`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/signup | No | Create account |
| POST | /api/login | No | Login |
| GET | /api/profile | Yes | Get profile |
| PUT | /api/profile | Yes | Update name |
| POST | /api/profile/avatar | Yes | Upload avatar |
| PUT | /api/change-password | Yes | Change password |
| DELETE | /api/account | Yes | Delete account |
| POST | /api/forgot-password | No | Request reset token |
| POST | /api/reset-password | No | Reset password |

### Products (`/products`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /products | No | List (search, filter, sort, paginate) |
| GET | /products/categories | No | Get categories |
| GET | /products/:id | No | Product detail + gallery + reviews |
| POST | /products/:id/reviews | Yes | Submit review |

### Cart (`/cart`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /cart | Yes | Get cart items |
| POST | /cart | Yes | Add to cart |
| PUT | /cart/:itemId | Yes | Update quantity |
| DELETE | /cart/:itemId | Yes | Remove item |

### Checkout (`/checkout`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /checkout/suggest-coupons | Yes | Get applicable coupons |
| POST | /checkout/create-payment-intent | Yes | Create Stripe intent |
| POST | /checkout/validate-coupon | Yes | Validate coupon code |
| POST | /checkout | Yes | Place order |

### Orders (`/orders`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /orders | Yes | User's orders |
| GET | /orders/:id | Yes | Order detail |
| PUT | /orders/:id/cancel | Yes | Cancel order |

### Wishlist (`/wishlist`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /wishlist | Yes | Get wishlist |
| POST | /wishlist | Yes | Add to wishlist |
| DELETE | /wishlist/:productId | Yes | Remove from wishlist |
| GET | /wishlist/check/:productId | Yes | Check if in wishlist |

### Notifications (`/api/notifications`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/notifications | Yes | Get notifications |
| PUT | /api/notifications/:id/read | Yes | Mark as read |
| PUT | /api/notifications/read-all | Yes | Mark all read |

### Admin (`/api/admin`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/admin/stats | Admin | Dashboard stats |
| POST | /api/admin/upload | Admin | Upload image |
| GET | /api/admin/products | Admin | List all products |
| POST | /api/admin/products | Admin | Create product |
| PUT | /api/admin/products/:id | Admin | Update product |
| DELETE | /api/admin/products/:id | Admin | Delete product |
| POST | /api/admin/products/:id/images | Admin | Upload gallery images |
| DELETE | /api/admin/products/images/:imageId | Admin | Delete gallery image |
| GET | /api/admin/orders | Admin | List all orders |
| PUT | /api/admin/orders/:id/status | Admin | Update order status |
| GET | /api/admin/users | Admin | List all users |
| PUT | /api/admin/users/:id/role | Admin | Toggle admin role |
| GET | /api/admin/coupons | Admin | List all coupons |
| POST | /api/admin/coupons | Admin | Create coupon |
| PUT | /api/admin/coupons/:id | Admin | Update coupon |
| DELETE | /api/admin/coupons/:id | Admin | Delete coupon |

### Health (`/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /health | No | Server + DB health check |

## Database Schema

PostgreSQL with 11 tables: `users`, `products`, `cart`, `orders`, `order_items`, `reviews`, `wishlist`, `notifications`, `coupons`, `password_resets`, `product_images`

10 indexes for performance on foreign keys, search (ILIKE), and common query patterns.

## License

MIT License — see [LICENSE](LICENSE) for details.
