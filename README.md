# 🥗 NutriTrack AI — Indian Diet Tracker

NutriTrack AI is a premium, state-of-the-art calorie and macro-nutrient tracker tailored specifically for the Indian diet. Powered by **Google Gemini** for natural language food logging and **Supabase** for secure authentication and real-time backend persistence, it provides users with instantaneous, AI-driven nutritional guidance.

---

## ✨ Features

- **🤖 Natural Language Food Logging**: Log your meals in plain English (e.g., `"2 aloo parathas with butter"` or `"rajma chawal and dahi"`). Gemini parses the text, extracts the food items, calculates quantities, and estimates calories and macronutrients (protein, carbs, fat) with high accuracy.
- **🇮🇳 Indian Diet Specialization**: Configured to recognize common Indian foods, recipes, and typical portion sizes.
- **📊 Dynamic Onboarding & Goal Calculation**: Collects age, gender, height, weight, activity levels, and weight goals during setup to calculate estimated BMR, TDEE, BMI, and personalized daily macro targets.
- **💧 Smart Water Logging**: Stay hydrated with one-click logging presets (Glass, Bottle) or custom milliliter entries.
- **💡 AI-Powered Daily Insights**: Get personalized feedback and actionable dietary recommendations based on your daily food and hydration logs.
- **🌗 Harmony Design System**: A gorgeous glassmorphic user interface that adapts dynamically to both Dark and Light modes.

---

## 🛠️ Tech Stack

- **Frontend Core**: React 19, TypeScript, Vite
- **Styling**: TailwindCSS, Lucide React (Icons)
- **State Management & Data Fetching**: TanStack React Query (v5)
- **Database & Auth**: Supabase (PostgreSQL, Auth, RLS Policies)
- **AI Models**: Google Gemini API (`gemini-2.0-flash` for instant, structural JSON outputs)

---

## 🚀 Getting Started

### 📋 Prerequisites

Ensure you have **Node.js (v20+)** and **npm** installed on your system.

### ⚙️ Installation & Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/AnitejSood/NUTRITRACK-AI.git
   cd NUTRITRACK-AI
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory of your project and populate it with your Supabase and Gemini credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_GEMINI_API_KEY=your-gemini-api-key
   ```

4. **Initialize the Database**:
   Log in to your **Supabase Dashboard**, open the **SQL Editor**, paste the contents of [supabase/schema.sql](file:///c:/Users/anite/OneDrive/Desktop/CalorieTracker/supabase/schema.sql), and click **Run**. This will create:
   - The tables for `profiles`, `nutrition_goals`, `meals`, `meal_items`, `water_logs`, and `daily_insights`.
   - Row-level security (RLS) policies protecting user data.
   - Authentication triggers to automatically initialize a public profile and auto-confirm mock registration email domains.

5. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser to view the application.

---

## 📂 Project Structure

- `src/components/` — Reusable layout shells, protected routes, and interactive dashboard graphs/rings.
- `src/hooks/` — Custom hooks managing Supabase database queries and mutations via React Query.
- `src/lib/` — Gemini AI logging prompt configurations, BMR/TDEE calculations, and Supabase client definitions.
- `src/pages/` — Application pages including Auth flow, Dashboard, Meal Logging, and Analytics.
- `supabase/` — Postgres schema definitions and triggers.

---

## 📄 Scripts

- `npm run dev` — Start the local Vite development server.
- `npm run build` — Build a minified production bundle with TypeScript checks.
- `npm run preview` — Locally preview the compiled production build.
- `npm run lint` — Lint code using ESLint.

