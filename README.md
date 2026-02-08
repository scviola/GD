# GDEA - Project Management System

A full-stack project management application with role-based access control, analytics, and task tracking capabilities.

## Tech Stack

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **CSS** - Styling

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM library
- **JWT** - Authentication
- **Nodemailer** - Email sending

## Project Structure

```
GDEA/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React context providers
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service files
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # Entry point
│   ├── index.html
│   └── vite.config.js
│
├── server/                 # Backend Node.js application
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Express middleware
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   └── server.js           # Entry point
│
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- pnpm (recommended) or npm

### Installation

1. Clone the repository

2. Install server dependencies:
```bash
cd server && pnpm install
```

3. Install client dependencies:
```bash
cd client && pnpm install
```

4. Create environment files:

**Server (.env):**
```env
PORT=5000
MONGODB_URI=
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
```

5. Start the development servers:

**Terminal 1 (Server):**
```bash
cd server && pnpm dev
```

**Terminal 2 (Client):**
```bash
cd client && pnpm dev
```

## Scripts

### Server (server directory)
- `pnpm dev` - Start development server
- `pnpm start` - Start production server

### Client (client directory)
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm lint` - Run ESLint

## Features

- **Authentication** - Login/Register with JWT tokens
- **Role-Based Access** - Admin, Manager, Staff roles
- **Project Management** - Create, update, and track projects
- **Task Tracking** - Log tasks with details and status
- **Notes System** - Add notes to projects
- **Analytics Dashboard** - View project statistics
- **Employee Summaries** - Track employee performance

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Notes
- `GET /api/notes` - Get all notes
- `POST /api/notes` - Create note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### Admin
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/stats` - Get system statistics


