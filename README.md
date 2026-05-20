# TaskFlow — Team Task Manager

A full-stack web application for managing team projects and tasks with role-based access control.

## 🚀 Live Demo

- **Frontend**: `https://taskflow-frontend.up.railway.app`
- **Backend API**: `https://taskflow-backend.up.railway.app/api/health`

> **Demo credentials**: `admin@taskflow.com` / `password123`

---

## ✨ Features

### Authentication
- JWT-based signup & login
- Persistent sessions via localStorage
- Protected routes (frontend + API)

### Project Management
- Create, edit, delete projects
- Color-coded project cards
- Project status: Active / Completed / On Hold / Archived
- Due date tracking

### Team Management
- Invite team members by email
- Assign roles: **Admin** or **Member** per project
- View and remove members

### Task Tracking
- Create tasks with title, description, priority, due date, and tags
- Assign tasks to project members
- **Kanban board** (drag-friendly column layout) — To Do / In Progress / Review / Done
- **List view** with sortable table
- Inline status updates from My Tasks page
- Comment threads on tasks

### Dashboard
- Task progress bar (by status)
- Stats: Projects, My Tasks, In Progress, Overdue, Completed
- Recent task feed

### Admin Panel
- View all users
- Change user roles (Admin ↔ Member)
- User statistics

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6 |
| Styling | Custom CSS with CSS Variables |
| HTTP Client | Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT + bcryptjs |
| Validation | express-validator |
| Deployment | Railway |

---

## 📁 Project Structure

```
taskflow/
├── backend/
│   ├── models/
│   │   ├── User.js        # User schema with password hashing
│   │   ├── Project.js     # Project with members array
│   │   └── Task.js        # Task with comments, tags, priority
│   ├── routes/
│   │   ├── auth.js        # signup, login, /me, profile
│   │   ├── projects.js    # CRUD + member management
│   │   ├── tasks.js       # CRUD + comments + dashboard stats
│   │   └── users.js       # Admin user management
│   ├── middleware/
│   │   └── auth.js        # JWT protect + requireAdmin
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.js   # Global auth state
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Signup.js
│   │   │   ├── Dashboard.js     # Stats + recent tasks
│   │   │   ├── Projects.js      # Project grid
│   │   │   ├── ProjectDetail.js # Kanban + list view
│   │   │   ├── MyTasks.js       # Filterable task list
│   │   │   └── AdminPanel.js    # User management
│   │   ├── components/
│   │   │   └── layout/Layout.js # Sidebar navigation
│   │   ├── utils/api.js         # Axios instance + all API calls
│   │   ├── App.js               # Routes with guards
│   │   └── index.css            # Design system + global styles
│   └── package.json
│
└── README.md
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/taskflow.git
cd taskflow
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm install
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
cp .env.example .env
# Edit .env: REACT_APP_API_URL=http://localhost:5000/api
npm install
npm start
```

App runs at `http://localhost:3000`

---

## 🌐 Railway Deployment

### Step 1: Deploy Backend
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select your repo → choose the `backend` folder (or root dir = `backend`)
3. Add environment variables:
   ```
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your-secret-key
   FRONTEND_URL=https://your-frontend.railway.app
   PORT=5000
   ```
4. Deploy and copy the generated URL

### Step 2: Deploy Frontend
1. New Service → same repo → root directory = `frontend`
2. Add environment variable:
   ```
   REACT_APP_API_URL=https://your-backend.railway.app/api
   ```
3. Deploy

### Step 3: Seed Demo Data (Optional)
```bash
curl -X POST https://your-backend.railway.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin User","email":"admin@taskflow.com","password":"password123","role":"admin"}'
```

---

## 🔐 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |

### Projects
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects` | List user's projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project |
| PUT | `/api/projects/:id` | Update project (admin) |
| DELETE | `/api/projects/:id` | Delete project (owner) |
| POST | `/api/projects/:id/members` | Add member |
| DELETE | `/api/projects/:id/members/:userId` | Remove member |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks` | My tasks (with filters) |
| GET | `/api/tasks/project/:id` | Tasks by project |
| GET | `/api/tasks/stats/dashboard` | Dashboard stats |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/:id` | Get task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| POST | `/api/tasks/:id/comments` | Add comment |

### Users (Admin only)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | List all users |
| GET | `/api/users/search` | Search users |
| PUT | `/api/users/:id/role` | Update role |

---

## 🔒 Role-Based Access Control

| Action | Member | Project Admin | App Admin |
|---|---|---|---|
| View own tasks | ✅ | ✅ | ✅ |
| Create tasks | ✅ | ✅ | ✅ |
| Update task status | ✅ | ✅ | ✅ |
| Add project members | ❌ | ✅ | ✅ |
| Delete project | ❌ | ❌ | ✅ (owner) |
| View all users | ❌ | ❌ | ✅ |
| Change user roles | ❌ | ❌ | ✅ |

---

## 📸 Screenshots

> Kanban board, Dashboard, Admin Panel — all visible after login.

---

## 👤 Author

Built for the Full-Stack Assignment.

---

## 📄 License

MIT
