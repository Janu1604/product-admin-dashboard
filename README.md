# Product Admin Dashboard

A small admin dashboard built with Next.js (App Router), React, Tailwind CSS and Axios,
using the [DummyJSON](https://dummyjson.com) API.

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login`.

Login with:
- **username:** `emilys`
- **password:** `emilyspass`

To build for production:

```bash
npm run build
npm start
```

## Project structure

```
app/
  login/page.js            → login page
  products/page.js          → product list (table/cards, search, filter, sort, pagination)
  products/[id]/page.js     → product detail + reviews
  products/[id]/edit/page.js→ edit form
  products/new/page.js      → add form
components/                 → reusable UI pieces (Navbar, forms, loader, modal, etc.)
lib/api.js                  → the ONE shared Axios instance (token + error handling)
lib/products.js             → all product API calls, separate from UI
lib/auth.js                 → login() call + localStorage token/user helpers
lib/hooks.js                → useDebounce hook for search
lib/localOverrides.js       → keeps add/edit/delete visible since DummyJSON doesn't persist them
```

## What's finished

- [x] Login with error handling, logout button, protected product pages
- [x] Product list: image, title, category, price, rating, stock
- [x] Responsive layout — table on desktop, cards on mobile
- [x] Pagination with page numbers, Previous/Next, page size (10/20/50), and
      "Showing X–Y of Z" text
- [x] Debounced search (waits for typing to stop), resets to page 1
- [x] Category filter + sort by price/rating/title
- [x] Product detail page with images, description, price, reviews
- [x] "Not found" page for an invalid product id
- [x] Add / edit form with validation
- [x] Delete with a confirm popup
- [x] Add/edit/delete changes stay visible after navigating away and back,
      even though DummyJSON doesn't persist them server-side
      (`lib/localOverrides.js` — see `NOTES.md` for details and limitations)
- [x] Loading, empty, and error (with Retry) states everywhere
- [x] One shared Axios instance that attaches the token and handles errors centrally
- [x] Page, search, filter, and sort state all live in the URL (shareable / refresh-safe)
- [x] No React Query / SWR / table libraries — all state and pagination logic is hand-written
- [x] Stale search responses can't overwrite newer ones (AbortController cancels in-flight requests)
- [x] Bad URL values (`?page=abc`, `?page=999`) are clamped instead of breaking the page
- [x] Login and Save buttons are disabled while a request is in flight, to stop duplicate submits

See `NOTES.md` for the reasoning behind a few specific decisions.
