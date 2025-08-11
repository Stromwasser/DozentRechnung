Dozent Invoicing App
A web application for freelance lecturers of integration courses in Germany to easily create, manage, and send invoices to clients.
Built with Vue 3 + Vite, Supabase (Auth, Database, RLS), and Node.js.

Features
User Authentication — Secure sign-up and login via Supabase Auth.

Profile Management — Save lecturer details for automatic use in invoices.

Client Management — Create and store client information for reuse.

Invoice Creation — Fill in invoice details including:

Provider and client info

Invoice number auto-generation (YYYY-MM-XXX format)

Lesson list with date, hours, and hourly rate

Itemized Lessons — Save multiple lesson entries linked to a single invoice.

PDF Export — Generate invoices that match a predefined template.

Data Security — Row-Level Security (RLS) ensures each user can access only their own data.

Tech Stack
Frontend: Vue 3, Vite, TypeScript

Backend & Database: Supabase (PostgreSQL + Auth + Storage)

Deployment: Vercel

Other: TailwindCSS for styling

Project Structure
bash
Kopieren
Bearbeiten
src/
components/ # Reusable Vue components
views/ # Main application pages
lib/ # Supabase client setup
router/ # Vue Router configuration
assets/ # Static files
Setup
Clone the repository

bash
Kopieren
Bearbeiten
git clone https://github.com/your-username/dozent-rechnungen.git
cd dozent-rechnungen
Install dependencies

bash
Kopieren
Bearbeiten
npm install
Configure environment variables
Create a .env file in the root directory:

ini
Kopieren
Bearbeiten
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
Run locally

bash
Kopieren
Bearbeiten
npm run dev
Build for production

bash
Kopieren
Bearbeiten
npm run build
Deployment
The project is deployed on Vercel.

On every push to main, Vercel automatically rebuilds and redeploys the application.

Future Improvements
Implement client selection from saved entries when creating invoices

Improve PDF styling for mobile-friendly exports

Add analytics dashboard for tracking hours and revenue

Implement multi-language support

License
This project is licensed under the MIT License.
