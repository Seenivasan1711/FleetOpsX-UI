# Cursor AI Instructions – React Web UI Bootstrap

This document is a **READY-TO-USE instruction file** for **Cursor AI**.
Paste this entire content into Cursor or save it as rules/context for automated project setup.

---

## Project Goal

Set up a **modern React Web application** in the **ROOT directory** with:

- Vite + React
- Tailwind CSS
- TanStack Query (server state + cache)
- Zustand (global UI state)
- Axios (API layer)
- React Router
- React Hook Form + Zod
- Dark mode support
- Clean, scalable folder structure

---

## 1. Project Initialization (ROOT DIRECTORY)

- Initialize a Vite React project in the **current directory** (do NOT create a new folder).
- Use **React (JavaScript)** template.
- Install dependencies.
- Verify the app runs using `npm run dev`.

---

## 2. Tailwind CSS Setup

- Install:
  - tailwindcss
  - postcss
  - autoprefixer
- Initialize Tailwind with PostCSS.
- Configure `tailwind.config.js`:
  - Scan `index.html`
  - Scan `src/**/*.{js,jsx}`
- Enable dark mode using `class` strategy.
- Update `src/index.css`:
  - Add Tailwind base, components, utilities.
- Remove unused default CSS files.

---

## 3. Server State & Caching

### Tool: TanStack Query

- Install `@tanstack/react-query`
- Create a `QueryClient`
- Wrap the app with `QueryClientProvider` in `main.jsx`
- Default options:
  - retry: 1
  - refetchOnWindowFocus: false

Purpose:

- API caching
- Background refetch
- Loading & error states
- Pagination & mutations

---

## 4. Global UI State

### Tool: Zustand

- Install `zustand`
- Create a global store containing:
  - theme: `light | dark`
  - authToken: `string | null`
- Persist the store using:
  - `zustand/middleware`
  - localStorage

Use cases:

- Dark mode toggle
- Authentication flags
- Global UI state

---

## 5. API Layer

### Tool: Axios

- Install `axios`
- Create an Axios instance at `src/api/client.js`
- Base URL must be read from:
  - `import.meta.env.VITE_API_URL`
- Export the configured instance

---

## 6. Routing

### Tool: React Router

- Install `react-router-dom`
- Use `BrowserRouter`
- Create routes:
  - `/` → Home page
  - `/login` → Login page
- Centralize routes in `src/routes/AppRoutes.jsx`

---

## 7. Forms & Validation

### Tools:

- react-hook-form
- zod
- @hookform/resolvers

Instructions:

- Use Zod for schema validation
- Integrate with React Hook Form
- Create a sample login form
- Show validation errors clearly

---

## 8. UI Enhancements

Install and configure:

- lucide-react (icons)
- framer-motion (animations)
- @headlessui/react (accessible components)
- react-hot-toast (notifications)

Add a global `<Toaster />` component at the app root.

---

## 9. Fonts

- Install `@fontsource/inter`
- Configure Tailwind to use Inter as default sans-serif font

---

## 10. Folder Structure (STRICT)

Create the following structure under `src/`:

src/
├── api/
│ └── client.js
├── components/
│ ├── ui/
│ │ ├── Button.jsx
│ │ ├── Input.jsx
│ │ └── Card.jsx
│ └── layout/
│ └── PageLayout.jsx
├── pages/
│ ├── Home.jsx
│ └── Login.jsx
├── routes/
│ └── AppRoutes.jsx
├── store/
│ └── useAppStore.js
├── hooks/
├── utils/
├── styles/
│ └── globals.css
├── App.jsx
└── main.jsx

---

## 11. Base UI Components

### Button

- Tailwind-only styling
- Rounded corners
- Hover & focus states
- Accessible

### Input

- Focus ring
- Error state support
- Full width

---

## 12. Developer Experience

- Install Prettier
- Configuration:
  - No semicolons
  - Single quotes
- Ensure consistent formatting

---

## 13. Verification Checklist

Ensure:

- App runs with `npm run dev`
- Tailwind styles apply correctly
- Dark mode toggles properly
- Zustand persists state on refresh
- React Query caches API data
- Routing works
- Toast notifications display
- No unused boilerplate remains

---

## Final Outcome

A **production-ready React UI foundation** with:

- Modern state management
- Built-in caching
- Scalable architecture
- Clean UI patterns
- Excellent developer experience
