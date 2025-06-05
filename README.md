# LED Display Management System Backend

Backend service for managing LED displays and content.

## Features

- User Authentication & Authorization
- Media Management (Upload, List, Delete)
- Screen Management
- Playlist Management
- Content Scheduling

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Setup

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create `.env` file:

   ```bash
   cp .env.example .env
   ```

   Update the environment variables as needed.

4. Create uploads directory:

   ```bash
   mkdir uploads
   ```

5. Start the server:

   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## API Endpoints

### Authentication

- POST /api/auth/register - Register new user
- POST /api/auth/login - Login user

### Media

- POST /api/media - Upload new media
- GET /api/media - Get all media
- GET /api/media/:id - Get single media
- DELETE /api/media/:id - Delete media

### Screens

- POST /api/screens - Create new screen
- GET /api/screens - Get all screens
- GET /api/screens/:id - Get single screen
- PUT /api/screens/:id - Update screen
- DELETE /api/screens/:id - Delete screen

### Playlists

- POST /api/playlists - Create new playlist
- GET /api/playlists - Get all playlists
- GET /api/playlists/:id - Get single playlist
- PUT /api/playlists/:id - Update playlist
- DELETE /api/playlists/:id - Delete playlist

## Project Structure

```
src/
├── controllers/     # Request handlers
├── models/         # Database models
├── routes/         # API routes
├── middleware/     # Custom middleware
└── app.js         # App entry point
```

## Environment Variables

- PORT - Server port (default: 5000)
- MONGODB_URI - MongoDB connection string
- JWT_SECRET - Secret key for JWT
- UPLOAD_DIR - Directory for file uploads
