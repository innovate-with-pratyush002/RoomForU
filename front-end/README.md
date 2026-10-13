# RoomForU frontend

Independent Next.js/React/TypeScript/Tailwind recreation of the existing EJS frontend. It intentionally does not change the Express application.

## Run it

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_BACKEND_URL` to the Express server URL (for example `http://localhost:3000`). Form actions, search, authentication, logout, reviews, and listing mutations then use the original backend routes and payload names.

The view currently uses representative fallback listings in `lib/data.ts` because the existing backend exposes rendered HTML routes rather than a JSON API. Replace that service with API endpoints when the backend provides them; no existing backend code was altered.
