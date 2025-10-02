# 🌿 AyurMed - Ayurvedic Healthcare Platform

## 📖 Project Overview
AyurMed is a full-stack web application designed to bring **Ayurvedic healthcare** into the digital space.  
It provides patients with easy access to Ayurvedic doctors, treatments, medicines, and online appointment booking.  
The platform also supports blogs, feedback, and product purchasing to make Ayurveda more accessible and modern.

The system is developed using **React (with TypeScript)** for the frontend, **Node.js + Express** for the backend, and **MongoDB Atlas** for the database.

---

## 🚀 Features
- 🔍 Doctor directory with search & filters  
- 📅 Appointment booking system  
- 📚 Repository of Ayurvedic treatments and medicines    
- ✍️ Blog & educational articles  
- ⭐ Ratings & feedback  
- 📊 Dashboards for patients, doctors, and admins  

---

## 🛠️ Tech Stack
- **Frontend**: React.js + TypeScript  
- **Backend**: Node.js + Express (TypeScript supported)  
- **Database**: MongoDB  
- **Authentication**: JWT-based login system  
- **Payments**: Stripe (optional integration)  

---

## ⚙️ Installation & Setup (Run in VS Code)

### 1. Clone the repository
```bash
git clone https://github.com/Maheesha-Tharangana/Ayurcura.git
cd Ayurcura


2. Install dependencies

For backend:

cd backend
npm install


For frontend (React + TypeScript):

cd frontend
npm install

3. Setup environment variables

Create a .env file in the backend folder with the following values:

MONGO_URI=your_mongodb_connection
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_key   # if using payments
PORT=5000

4. Run the project
Backend (Node.js + TypeScript)

If package.json includes a dev script:

cd backend
npm run dev


If not, build first and then run:

npm run build
npm start

Frontend (React + TypeScript)
cd frontend
npm start


Then open in your browser:

http://localhost:3000

👨‍💻 How to Run in VS Code

Open the project folder in VS Code.

Install recommended extensions:

ES7+ React/Redux snippets

TypeScript React (tsx)

MongoDB for VS Code

REST Client or Thunder Client for API testing

Open the integrated terminal (Ctrl + ~).

Use two terminals in VS Code:

One for backend (npm run dev or npm start)

One for frontend (npm start)

Navigate to http://localhost:3000
 to view the app.

📌 Notes

Make sure MongoDB Atlas is connected and .env is properly configured.

Use npm run build for production builds.

Update .env values with your own API keys and secrets.
