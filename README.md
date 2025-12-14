# FleetOpsX UI

A modern React web app for FleetOpsX, bootstrapped with Vite, Tailwind CSS, TanStack Query, Zustand, Axios, React Router, React Hook Form, Zod, and more.

## Requirements

- **Node.js:** v22.12.0 or later

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the development server

```bash
npm run dev
```

The app will run on `http://localhost:5173` (or specified port).

## Tech Stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Axios](https://axios-http.com/)
- [React Router](https://reactrouter.com/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
- [Lucide React](https://lucide.dev/), [Framer Motion](https://www.framer.com/motion/), [Headless UI](https://headlessui.com/), [React Hot Toast](https://react-hot-toast.com/)

## Folder Structure

See `docs/bootstrap/react-ui-bootstrap-cursor-instructions.md` for strict breakdown. Key folders:

```
src/
  api/
  components/
    ui/
    layout/
  pages/
  routes/
  store/
  hooks/
  utils/
  styles/
```

## Coding Conventions

- Use [Prettier](https://prettier.io/) for formatting (no semicolons, single quotes)
- Use Tailwind Utility classes
- Prefer function components and hooks
- Strict typing and validation using Zod

## Environment Variables

Create a `.env` file:

```
VITE_API_URL=<your-api-url>
```

## Further Reading

- See `docs/bootstrap/react-ui-bootstrap-cursor-instructions.md` for setup details and architecture
- Ask questions in project chat/Slack if needed
