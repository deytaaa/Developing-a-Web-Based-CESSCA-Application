# CESSCA Web Application - Client Setup Guide

Welcome! This guide will help you set up and run the CESSCA Web Application on your own computer.

---

## 1. Prerequisites

Before you begin, please install the following:

- **Node.js** (v16 or higher): [Download Node.js](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MySQL Community Server** (v8.0 or higher): [Download MySQL](https://dev.mysql.com/downloads/)
- **MySQL Workbench** (optional, for GUI database management): [Download MySQL Workbench](https://dev.mysql.com/downloads/workbench/)
- **Git** (for downloading the code): [Download Git](https://git-scm.com/downloads)
- **A code editor** (e.g., VS Code): [Download VS Code](https://code.visualstudio.com/)

---

## 2. Download the Project Code

1. **Clone the repository from GitHub:**
   ```bash
   git clone https://github.com/your-username/your-repo-name.git
   cd your-repo-name
   ```
   *(Replace with your actual GitHub repo URL)*

---

## 3. Database Setup

1. **Start MySQL Server** (ensure MySQL is running on your machine).
2. **Create the database:**
   - Open MySQL Workbench or the MySQL command line.
   - Run:
     ```sql
     CREATE DATABASE cessca_db;
     ```
3. **Import the schema:**
   - Using command line:
     ```bash
     mysql -u root -p cessca_db < database/schema.sql
     ```
   - Or, in MySQL Workbench: File > Run SQL Script > Select `schema.sql` from the `database` folder.

---

## 4. Backend Setup

1. **Navigate to the backend folder:**
   ```bash
   cd backend
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure environment variables:**
   - Copy `.env.example` to `.env` (or create `.env`):
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and set your MySQL credentials (DB_USER, DB_PASSWORD, etc.).
   - Make sure `PORT=5000` and `DB_NAME=cessca_db`.
4. **Start the backend server:**
   ```bash
   npm run dev
   ```
   - The backend API will run at: http://localhost:5000/api
   - Test with: http://localhost:5000/health

---

## 5. Frontend Setup

1. **Open a new terminal and navigate to the frontend folder:**
   ```bash
   cd frontend
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Check the `.env` file:**
   - Ensure it contains:
     ```env
     VITE_API_URL=http://localhost:5000/api
     ```
4. **Start the frontend server:**
   ```bash
   npm run dev
   ```
   - The frontend will run at: http://localhost:5173

---

## 6. Login Credentials

- **Admin:** admin@ptc.edu.ph / admin123
- **CESSCA Staff:** cessca@ptc.edu.ph / cessca123
- **Student:** student@ptc.edu.ph / student123

---

## 7. Troubleshooting

- **Database connection errors:**
  - Make sure MySQL is running and credentials in `.env` are correct.
  - Ensure the database `cessca_db` exists and schema is imported.
- **Backend errors:**
  - Check terminal for error messages.
  - Ensure all dependencies are installed.
  - Make sure port 5000 is not in use by another app.
- **Frontend errors:**
  - Ensure backend is running before starting frontend.
  - Check that `VITE_API_URL` is correct in `.env`.

---

## 8. Additional Notes

- For production deployment, use secure passwords and update JWT_SECRET.
- You can manage the database using MySQL Workbench for convenience.
- For any issues, contact the developer or open an issue on GitHub.

---

## 9. Updating the Code

If you receive updates from the developer, pull the latest code:
```bash
git pull origin main
```

---

**Congratulations! Your CESSCA system should now be up and running.**
