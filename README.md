# 🎓 EduSync
**The Next-Generation School Management & Learning Platform**

EduSync is a comprehensive, full-stack, enterprise-grade SaaS application designed to bridge the communication gap between school administrators, teachers, students, and parents. It seamlessly blends a School Management System (SMS) with a Learning Management System (LMS) into a single, beautifully designed platform.

---

## ✨ Key Features

### 🔐 Role-Based Access Control (RBAC)
The platform dynamically adapts its interface and permissions based on four distinct user roles:
* **Admin:** Full system control, analytics, user enrollment, billing, and mass broadcasts.
* **Teacher:** Class management, module uploads, attendance tracking, and grading.
* **Student:** Access to learning materials, CBT exams, timetables, and report cards.
* **Parent:** Linked view-only access to monitor their child's academic progress, attendance alerts, and fee payments.

### 🚀 Core Modules
* **📊 System Overview:** Real-time analytics dashboard for administrators.
* **📚 Subject & Curriculum Management:** Secure upload portal for syllabuses and PDF learning modules.
* **👨‍🎓 Student Roster:** Enrollment system with Parent-to-Student account linking.
* **📝 Daily Roll Call:** Interactive attendance tracking that automatically dispatches email alerts to parents if a student is marked absent.
* **💻 CBT Engine:** Create, distribute, and auto-grade multiple-choice Computer-Based Tests.
* **🗓️ Timetable Builder:** Interactive, drag-and-drop style weekly schedule builder.
* **🏛️ School Vault:** Centralized repository for global school documents and policies.
* **📢 Mass Broadcast:** Integrated email engine to send official newsletters or alerts to specific user groups.
* **💳 Billing & Finance:** Digital invoicing system with simulated payment gateways and automated PDF receipts.
* **💬 Live Chat:** Real-time global WebSocket chat lounge for instant communication.
* **🎓 Grading & Transcripts:** Input raw scores to automatically calculate percentages and generate downloadable PDF Report Cards.

---

## 🛠️ Tech Stack

**Frontend (Client)**
* [React.js](https://react.dev/) (Vite)
* [Tailwind CSS](https://tailwindcss.com/) (Styling & Dark Mode)
* [Lucide React](https://lucide.dev/) (Premium Iconography)
* [React Router](https://reactrouter.com/) (Navigation)
* [jsPDF](https://github.com/parallax/jsPDF) & [AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable) (Report Card Generation)
* [Socket.io-client](https://socket.io/) (Real-time Chat)

**Backend (Server)**
* [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/) (RESTful API)
* [PostgreSQL](https://www.postgresql.org/) (Relational Database via `pg`)
* [JSON Web Tokens (JWT)](https://jwt.io/) & [Bcrypt](https://www.npmjs.com/package/bcrypt) (Authentication & Security)
* [Socket.io](https://socket.io/) (WebSocket Engine)
* [Nodemailer](https://nodemailer.com/) (Automated Email Triggers)
* [Multer](https://www.npmjs.com/package/multer) (File Uploads)

---

## ⚙️ Local Setup & Installation

### Prerequisites
* Node.js (v16 or higher)
* PostgreSQL installed and running locally
* A Gmail account for Nodemailer (App Password required)

### 1. Clone the Repository
\`\`\`bash
git clone https://github.com/yourusername/edusync.git
cd edusync
\`\`\`

### 2. Database Setup
1. Open pgAdmin or your terminal SQL shell.
2. Create a new database named `EduSync`.
3. Copy the contents of `backend/database.sql` and execute it to generate all the necessary tables.

### 3. Backend Configuration
Navigate to the backend directory and install dependencies:
\`\`\`bash
cd backend
npm install
\`\`\`

Create a `.env` file inside the `backend` folder and add the following variables:
\`\`\`env
# Database Configuration
PORT=5000
DB_USER=postgres
DB_PASSWORD=your_database_password
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=EduSync

# Security
JWT_SECRET=your_super_secret_jwt_key

# Nodemailer Configuration (Gmail)
EMAIL_USER=your_school_email@gmail.com
EMAIL_PASS=your_gmail_app_password
\`\`\`

Start the backend server:
\`\`\`bash
npm run dev
\`\`\`

### 4. Frontend Configuration
Open a new terminal window, navigate to the client directory, and install dependencies:
\`\`\`bash
cd client
npm install
\`\`\`

Start the Vite development server:
\`\`\`bash
npm run dev
\`\`\`

---

## 🚀 Usage Guide

1. Open your browser and navigate to `http://localhost:5173`.
2. Click **Get Started / Register** to create your first account. Make sure to select **"School Admin"** as your role.
3. Log in with your new Admin credentials.
4. Explore the dashboard! Start by adding Subjects, enrolling Teachers/Students, and linking Parents.

---

## 🎨 UI/UX Highlights
EduSync features a premium, "Silicon Valley" aesthetic built entirely with Tailwind CSS. It includes:
* A modern **Boxed SaaS Layout** with a fixed vertical sidebar.
* **Glassmorphism** effects and soft gradients on analytics cards.
* Full **Dark Mode** support across all components.
* Carefully crafted "Empty States" to guide users when data is absent.

---

## 📄 License
This project is licensed under the MIT License. Feel free to use, modify, and distribute it as you see fit.