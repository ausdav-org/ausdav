# AUSDAV Connect

AUSDAV Connect is the web presence for the All University Students' Development Association Vavuniya. The site highlights programs, events, and resources that support student development in the region.

## Tech stack

- Vite + React + TypeScript
- shadcn-ui + Tailwind CSS
- Supabase

## Getting started

Prerequisites: Node.js 18+ and npm.

```sh
git clone <YOUR_GIT_URL>
cd ausdav-connect
npm install
npm run dev
```

## Available scripts

- `npm run dev` – start the development server
- `npm run build` – create a production build
- `npm run build:dev` – create a development-mode build
- `npm run preview` – preview the production build locally
- `npm run lint` – lint the codebase

## Deployment

Build the site with `npm run build` and deploy the `dist` directory to your chosen hosting platform (e.g., Vercel, Netlify, or any static host). Ensure environment variables for Supabase are configured in your deployment platform.
