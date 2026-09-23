# Notes

## Search vs. category filter
DummyJSON can't search and filter by category in the same request. When the
user types a search query, the category dropdown is disabled and cleared —
search wins. This felt more natural than the reverse, since typing is a more
deliberate action than a leftover dropdown selection. This is decided in
`components/ProductsListClient.js`, in the effect that syncs the debounced
search value into the URL.

## Add / edit / delete aren't really saved
DummyJSON's `/products/add`, `PUT /products/:id`, and `DELETE /products/:id`
all return a valid, realistic-looking response but don't persist anything on
their server — refreshing the page, or just navigating away and back, brings
back the original data.

My first pass only updated in-memory component state, which meant the
change looked like it worked right up until you navigated to a different
page and the list re-fetched from the API — at which point the add/edit
silently vanished. That's a real bug I caught on review, not just a docs
mismatch, so I fixed the actual behavior:

`lib/localOverrides.js` keeps a small `added` / `edited` / `deletedIds`
record in `localStorage`. After a successful add/edit/delete API call, the
change is also written there. Every place that reads products (`/products`
list, `/products/[id]` detail, the edit form) merges these overrides on top
of whatever the API returns, so the change is visible for the rest of the
browser session — including after navigating away and back — even though
DummyJSON itself never actually stored it.

**Known limitation:** a newly-added product only shows up on the plain,
unfiltered page 1 of the list (no active search/category/sort), since there's
no reliable way to know whether a locally-added item would actually match a
given filter against the real API's data. Also, DummyJSON's demo `/products/add`
endpoint tends to hand back the same placeholder id for every new product in
a session, so adding more than one product back-to-back will overwrite the
previous locally-added entry rather than create two separate ones.

## A problem I ran into: stale search results
Typing quickly in the search box fired a new request on every keystroke
(after debouncing helped, but slow/delayed responses could still arrive out
of order — e.g. "sh" resolving after "shoe" because of network timing).
Fixed by keeping an `AbortController` in a ref and cancelling the previous
in-flight request every time a new one starts, in `loadProducts()`. Canceled
requests are recognized in the Axios interceptor and in the catch block so
they don't get treated as real errors.

## API calls staying out of UI code
The login request originally lived directly inside `app/login/page.js`
(`api.post('/auth/login', ...)`), which broke the rule that API calls belong
in separate files. Moved it into a `login()` function in `lib/auth.js`,
alongside the other auth-related helpers — the login page now just calls
`login(username, password)`. `lib/auth.js` importing from `lib/api.js`
(and vice versa, for `getToken`/`clearAuth`) is a circular import, but it's
safe here because neither file touches the other's export until a function
actually runs — nothing happens at module-load time — and the production
build confirms it resolves cleanly.

## Where AI helped
I used AI assistance to scaffold the project structure, write the pagination
and URL-sync logic, and get the responsive table/card layout right on the
first pass. I reviewed and tested every file — the whole project builds
cleanly (`npm run build`) and was smoke-tested against the live DummyJSON
API before submitting. I can walk through and explain any part of the code.
