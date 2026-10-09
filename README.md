# HashChat v2 🔒

Privacy-first, real-time anonymous chat using Firebase Realtime Database and browser-side AES-GCM encryption.

## What's new in v2

- Strong random room IDs and 256-bit room secrets.
- Encryption secret lives in the URL fragment (`#ROOM_ID.SECRET`) and is never part of the Firebase path.
- Anonymous Firebase Authentication for database access without a user profile.
- Presence / participant count.
- Typing indicator.
- Message search.
- Copy and delete-your-own-message actions.
- 2,000-character message limit.
- Room expiry indicator (24 hours).
- Explicit **Destroy Room** control.
- Reconnect status.
- File attachments (images, PDFs, docs, and more up to 10MB), stored encrypted in Supabase Storage.
- Unread browser-title indicator.
- PWA manifest + service worker.
- Safer message rendering using `textContent` instead of `innerHTML`.
- Firebase Realtime Database security rules included.

## Firebase setup

1. Open your Firebase project.
2. Enable **Authentication → Sign-in method → Anonymous**.
3. Create/enable **Realtime Database**.
4. In Realtime Database → Rules, paste the contents of `firebase.database.rules.json`.
5. Keep the Firebase web config in `script.js`. Firebase web API keys identify the project; database rules and Authentication provide access control.

> The included rules allow authenticated anonymous clients to read a room. Only the room creator can modify the room root/destroy it, and users can only create/delete their own messages and presence/typing records.

## File attachments (optional Supabase)

Attachments are AES-GCM encrypted in the browser before upload; only encrypted bytes leave the device. File metadata (name, size, type) rides inside the encrypted message `text` field, so it is not visible as plaintext in Firebase.

1. In Supabase, create a bucket named `hashchat-files`.
2. Add a storage policy that lets anonymous authenticated users upload and download under the `rooms/` path.
3. At the top of `script.js`, set `SUPABASE_URL` and `SUPABASE_ANON_KEY` (the defaults point at the author's demo project; replace with your own keys).

Supported types: images (JPEG/PNG/GIF/WebP), PDF, TXT, CSV, ZIP, and Office documents, up to 10MB each.

## Run locally

Use a local HTTP server because ES modules, Firebase Authentication, and the service worker should run from a web origin.

```bash
python -m http.server 8000
```

Open `http://localhost:8000`.

## Deploy

This is a static site and can be deployed to GitHub Pages, Netlify, Vercel, Cloudflare Pages, or any static host. Configure the host for SPA/static fallback only if your deployment requires it; HashChat stores the room ID and key in the URL fragment, so the server does not need to receive the room route.

## Important privacy model

HashChat encrypts message contents in the browser before writing them to Firebase. The database therefore receives ciphertext, but it still receives metadata such as room paths, anonymous Firebase authentication information, timestamps, presence, and encrypted message sizes.

Closing a tab removes that client's presence. It does **not** guarantee that all database data disappears. Use **Destroy Room** to explicitly remove the room and its stored data. Firebase/network/provider logs are outside the application's control.

## URL format

```text
https://your-domain.example/#ROOM_ID.SECRET_KEY
```

The fragment is intentionally used for the secret because URL fragments are handled client-side and are not sent as part of the HTTP request to the origin server.

## Project structure

```text
hashchat/
├── index.html
├── script.js
├── stylesheet.css
├── firebase.database.rules.json
├── manifest.webmanifest
├── sw.js
├── SECURITY.md
├── PRIVACY.md
├── TERMS.md
└── DOCS.md
```

## Security note

HashChat is a student/project application, not a professionally audited secure messenger. AES-GCM protects message confidentiality when the secret remains private, but it does not hide all metadata and does not protect a compromised device/browser. Do not use it for high-risk communications without an independent security review.