<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-27 | **Commit:** e749d3e | **Branch:** main

## OVERVIEW

"Apparta" — Artist directory module for Colombian restaurants. Next.js 16.2.1 + React 19.2.4 + shadcn/ui (base-nova) + Tailwind CSS v4. Spanish-language UI. Mock data only — no backend, auth, or DB yet.

## STRUCTURE

```
src/
├── app/                  # App Router pages
│   ├── layout.tsx        # Root: Poppins font, TooltipProvider, lang="es"
│   ├── page.tsx          # Redirects -> /login
│   ├── globals.css       # Design tokens, light/dark themes
│   ├── login/            # Login form (email+password, NO auth logic)
│   ├── registro/         # Artist registration form (NO submission logic)
│   ├── catalogo/         # Public artist catalog with filters
│   └── admin/            # Sidebar layout (SidebarProvider + AppSidebar)
│       ├── lista/        # Artist table with search/filters
│       ├── crear/        # Create artist form
│       └── aprobaciones/ # Approval queue (badge "3" hardcoded)
├── components/
│   ├── ui/               # 17 shadcn/ui components (DO NOT hand-edit)
│   ├── app-sidebar.tsx   # Admin nav: Artistas, Aprobaciones
│   ├── nav-user.tsx      # Sidebar footer user dropdown
│   └── social-icons.tsx  # Instagram, YouTube, TikTok, Spotify SVGs
├── hooks/
│   └── use-mobile.ts     # 768px breakpoint detection
└── lib/
    ├── utils.ts          # cn() — clsx + tailwind-merge
    └── data.ts           # Artist types, mock data, formatPrice(COP)
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add a route | `src/app/{route}/page.tsx` | Follow App Router conventions |
| Add admin page | `src/app/admin/{route}/page.tsx` | Gets sidebar layout automatically |
| Add UI component | `npx shadcn@latest add {name}` | Goes to `src/components/ui/` |
| Custom component | `src/components/{name}.tsx` | Named export, PascalCase |
| Add hook | `src/hooks/use-{name}.ts` | `useIsMobile` as reference |
| Types & mock data | `src/lib/data.ts` | `Artist`, `ArtistType`, `Genre`, `ArtistStatus` |
| Theme colors | `src/app/globals.css` `:root` block | CSS variables, NOT tailwind.config |
| shadcn config | `components.json` | base-nova style, lucide icons |

## CONVENTIONS

### Styling
- **Tailwind CSS v4** — theme via `@theme inline` + CSS variables in `globals.css`. NO `tailwind.config` file.
- **Brand color**: `--whatsapp: #25D366`. Reference as `var(--whatsapp)` in inline styles or `bg-primary` in Tailwind.
- **Status colors**: `--success`, `--warning`, `--error` with `*-bg` background variants.
- **Dark sidebar**: Slate tones (`--sidebar: #1E293B`). Dark sidebar, light content area.
- Always merge classes with `cn()` from `@/lib/utils`.

### Components
- **shadcn/ui base-nova** style + **@base-ui/react** headless primitives.
- UI components use `data-slot` attribute pattern for styling.
- Variants via **CVA** (class-variance-authority).
- Compound components: `Card` -> `CardHeader`, `CardContent`, `CardFooter`.
- `SidebarMenuButton` uses `render` prop for Link integration (NOT `asChild`).

### Data & State
- **Local state only** — `useState` for filters/search. No Redux/Zustand/Context.
- **Mock data** in `src/lib/data.ts` — no API routes, no database.
- **Price formatting**: `formatPrice()` -> `Intl.NumberFormat("es-CO", { currency: "COP" })`.
- **No auth** — login/registro pages are visual shells only.

### Code Style
- `"use client"` on all interactive components. Server components only for layouts and redirects.
- **Spanish UI text** — all labels, placeholders, metadata in Spanish.
- **`@/` path alias** for all imports — never relative paths from components.
- Named exports everywhere (no default exports except page components).
- Icons: `import { IconName } from "lucide-react"`.

## ANTI-PATTERNS

- **DO NOT hand-edit `src/components/ui/`** — managed by shadcn CLI.
- **DO NOT use `tailwind.config`** — Tailwind v4 uses `@theme inline` in `globals.css`.
- **NO `as any` / `@ts-ignore`** — TypeScript strict mode enforced.
- **NO relative imports** from components — always `@/` alias.
- `nav-user.tsx` dropdown text still in English ("Account", "Log out") — not yet translated.

## COMMANDS

```bash
bun run dev      # Dev server (localhost:3000)
bun run build    # Production build
bun run start    # Production server
bun run lint     # ESLint
```

## NOTES

- **Next.js 16.2.1** — Read `node_modules/next/dist/docs/` before using any API. Breaking changes.
- **Bun** package manager (`bun.lock`). Use `bun add`, not `npm install`.
- **No tests, no CI/CD, no Docker, no `.env` files** — early-stage project.
- WhatsApp link in catalogo hardcodes country code `57` (Colombia).
- Sidebar badge `"3"` for aprobaciones is hardcoded, not dynamic.
- `use-mobile.ts` accesses `window` inside `useEffect` — safe, but initial render returns `undefined`.
