# BlingzStore

An ecommerce web application built with React + Express + SQLite.

## Tech Stack

**Frontend:** React, Tailwind CSS, React Router, Vite
**Backend:** Express.js, SQLite (sql.js), JWT Auth
**Styling:** Tailwind CSS

## Features

- Product browsing with detail pages
- User signup & login (JWT authentication)
- Shopping cart (add/remove items)
- Checkout with shipping form
- Order confirmation
- Toast notifications
- Responsive design
- Dark theme footer + hero sections

## Project Structure

```
├── client/          # React frontend
│   ├── src/
│   │   ├── components/   # Navbar, Footer, ProductCard
│   │   ├── pages/        # Home, Login, Signup, Cart, Checkout, ProductDetail
│   │   ├── context/      # AuthContext
│   │   ├── api.js        # Fetch wrapper
│   │   └── App.jsx       # Routes
│   └── package.json
│
├── server/          # Express backend
│   ├── routes/      # auth, products, cart, checkout
│   ├── middleware/   # JWT auth middleware
│   ├── db.js        # SQLite setup
│   ├── index.js     # Server entry
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v18+)

### Installation

```bash
# Backend
cd server
npm install

# Frontend
cd client
npm install
```

### Running

```bash
# Terminal 1 — Backend (port 5000)
cd server
node index.js

# Terminal 2 — Frontend (port 3000)
cd client
npm run dev
```

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/signup | No | Create account |
| POST | /api/login | No | Login |
| GET | /products | No | List products |
| GET | /products/:id | No | Product detail |
| GET | /cart | Yes | View cart |
| POST | /cart | Yes | Add to cart |
| DELETE | /cart/:itemId | Yes | Remove from cart |
| POST | /checkout | Yes | Place order |

## License

ISC
