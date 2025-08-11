## URL Shortener App (MERN)

Simple URL shortener built with React (Vite) + Node.js/Express + MongoDB (via Mongoose).

### Objective

- Users submit a long URL and receive a short URL.
- Visiting the short URL redirects to the original URL.

- ### screeshot
- <img width="1899" height="1056" alt="image" src="https://github.com/user-attachments/assets/77a4c4db-f400-4849-9e2b-78fb90ad8295" />


### Features

- Input a long URL and get a short URL immediately.
- Visit short URL to be redirected to the original.
- Optional admin section listing all URLs with click counts.

### Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Utilities: nanoid for short codes, CORS, dotenv

### Folder Structure

```
.
├─ client/              # React app (Vite)
│  ├─ src/App.jsx
│  └─ src/App.css
└─ server/              # Express + Mongoose API
   ├─ src/index.js      # Routes + server
   └─ src/models/Url.js # Mongoose model
```

### API Endpoints (Backend)

- POST `/api/shorten`
  - Body: `{ "url": "https://example.com/very/long/path" }`
  - Response: `{ shortCode: string, shortUrl: string, originalUrl: string }`
- GET `/:shortcode`
  - Redirects to the original URL
- GET `/api/admin/urls` (optional bonus)
  - Lists all shortened URLs with click counts

### Environment Variables

- `server/.env`
  - `PORT=5000`
  - `MONGODB_URI=<your_mongodb_uri>` (Atlas or local). If omitted, the app falls back to an in-memory MongoDB (ephemeral, data resets on restart).
  - `BASE_URL=http://localhost:5000`
- `client/.env` (optional)
  - `VITE_API_BASE_URL=http://localhost:5000`

### Prerequisites

- Node.js 18+ and npm
- MongoDB:
  - EITHER: MongoDB Atlas connection string
  - OR: Local MongoDB Community Server running

### Install & Run

Open two terminals.

1. Backend (server)

```
cd server
npm install
npm run dev
```

If you did not set `MONGODB_URI`, the backend will use an in-memory MongoDB (data is not persisted).

2. Frontend (client)

```
cd client
npm install
npm run dev
```

Visit `http://localhost:3000`.

### How to Use

1. Paste a long URL and click "Shorten URL".
2. Copy or open the generated short URL.
3. Optional: Click "Refresh" in the Admin card to list all shortened URLs and see click counts.

### Notes

- Short codes are generated with `nanoid(6)` and checked for collisions.
- Redirects are handled on the backend route `GET /:shortcode`.
- CORS is enabled for local development.

### Troubleshooting

- Running `npm run dev` in the project root errors with ENOENT:
  - Run commands inside `server` or `client` directories, not the root.
- MongoDB connection error:
  - Provide a valid `MONGODB_URI` in `server/.env` (Atlas or local), or rely on the in-memory fallback.

