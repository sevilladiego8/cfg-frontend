# CFG Tickets Management — Frontend

React SPA for managing purchase tickets imported from Excel. Provides full CRUD for suppliers, lands, products, and tickets, with paginated tables and a summary dashboard.

# Tools Used

**Main**
- React + Vite
- Axios
- TanStack Query
- React Hook Form + Zod
- React Router

**Styles**
- Tailwind CSS v4
- shadcn/ui (base-nova)

# Project Structure

```
src/
├── api/          # Axios API functions per entity
├── components/   # Reusable UI components (DataTable, ConfirmDialog, etc.)
├── hooks/        # Custom React hooks
├── layouts/      # App shell with sidebar navigation
├── pages/        # One file per route (Dashboard, Suppliers, Lands, Products, Tickets)
├── types/        # Shared TypeScript interfaces
└── utils/        # Utility helpers
```

# How to Run

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```

The app expects the backend API to be running. See the backend README for setup instructions.

# Purpose of Tools

## TanStack Query
Handles all server state: fetching, caching, and invalidation after mutations. Avoids manual loading/error state management across components.

## React Hook Form + Zod
Form state and validation. Zod schemas define the shape and constraints; `zodResolver` bridges them to React Hook Form.

## shadcn/ui
Headless component library where you own the component source. Uses the base-nova style built on `@base-ui/react`. Components live in `src/components/ui/` and can be fully customized.
