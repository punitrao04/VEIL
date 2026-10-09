# VEIL

<p align="center">
  <img src="icon.svg" alt="VEIL Logo" width="100">
</p>

<h1 align="center">VEIL</h1>

<p align="center">
  <strong>Private conversations. No accounts. Just share the room.</strong>
</p>

<p align="center">
  A privacy-focused, anonymous real-time chat application with client-side
  encryption, private rooms, and encrypted file sharing.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#technology-stack">Technology</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#security--privacy">Security</a>
</p>

---

## 🔐 About VEIL

**VEIL** is a privacy-focused, anonymous real-time chat application designed
for simple and private communication.

Users do not need to create a traditional account or provide personal
information to start a conversation.

Instead, VEIL generates a private room link that can be shared with another
person. The room secret is contained in the private link and is used by the
client to derive the encryption key.

Messages are encrypted in the browser before being stored in the backend.

> **No traditional registration. No public profiles. Just a private room.**

---

## ✨ Features

### 🔒 Privacy & Security

- Client-side AES-GCM encryption
- Room-specific encryption keys
- Private room secrets contained in the URL fragment
- Anonymous Firebase authentication
- No traditional user registration
- No usernames or public profiles
- Encrypted message payloads
- Encrypted file attachments
- Client-side encryption before storage

### 💬 Real-Time Messaging

- Real-time text messaging
- Multiple messages per room
- Automatic message synchronization
- Message timestamps
- Connection status
- Reconnection support
- Message history within the active room

### ↩️ Message Replies

Reply directly to previous messages.

Replies preserve information about the original message while remaining part
of the encrypted message payload.

### 🗑️ Message Management

- Delete your own messages
- Message ownership based on anonymous sender ID
- Users cannot use the interface to delete another user's messages

### 📎 File & Image Sharing

VEIL supports encrypted attachments including:

- Images
- PDF files
- Text files
- CSV files
- ZIP archives
- Documents
- Spreadsheets
- Presentations

Maximum attachment size:

```text
10 MB
```

Attachments are encrypted in the browser before being uploaded to storage.

### 👤 Anonymous Presence

VEIL supports:

- Online presence
- Typing indicators
- Anonymous Firebase sessions
- Connection status

### 📱 Progressive Web App

VEIL includes PWA support with:

- Web app manifest
- Service worker
- Installable application support
- Responsive interface
- Mobile-friendly design

---

# 🧠 How It Works

The basic VEIL workflow is:

```text
                 ┌──────────────────┐
                 │    Open VEIL     │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │  Generate Room   │
                 │      Link        │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │  Share Private   │
                 │      Link        │
                 └────────┬─────────┘
                          │
                          ▼
          ┌────────────────────────────────┐
          │        Enter Private Room      │
          └────────────────┬───────────────┘
                           │
                           ▼
                 ┌──────────────────┐
                 │ Encrypt Message  │
                 │   Client-Side    │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │ Firebase Realtime │
                 │     Database      │
                 └──────────────────┘
```

---

# 🔑 Encryption Architecture

VEIL uses the browser's **Web Crypto API** and AES-GCM encryption.

The room secret is used to derive an encryption key.

Conceptually:

```text
Private Room Secret
        │
        ▼
     SHA-256
        │
        ▼
   AES-GCM Key
        │
        ▼
Encrypt Message
        │
        ▼
Encrypted Payload
        │
        ▼
Firebase Realtime Database
```

The database receives the encrypted payload rather than the original plaintext
message.

## Attachment Encryption

Files follow a similar process:

```text
File
 │
 ▼
Read File Bytes
 │
 ▼
Encrypt in Browser
 │
 ▼
Upload Encrypted Data
 │
 ▼
Supabase Storage
```

The attachment is encrypted before being uploaded to storage.

---

# 🏗️ Technology Stack

## Frontend

- HTML5
- CSS3
- JavaScript
- Web Crypto API
- Service Workers
- Progressive Web App APIs

## Authentication

- Firebase Anonymous Authentication

## Real-Time Database

- Firebase Realtime Database

## File Storage

- Supabase Storage

## Encryption

- AES-GCM
- SHA-256
- Web Crypto API

## External Libraries & Services

- Firebase Web SDK
- Supabase JavaScript Client
- Google Fonts

---

# 📁 Project Structure

```text
VEIL/
│
├── index.html
├── script.js
├── stylesheet.css
├── icon.svg
├── manifest.webmanifest
├── sw.js
│
├── firebase.database.rules.json
├── firebase.storage.rules
├── supabase.storage.sql
│
├── README.md
├── DOCS.md
├── PRIVACY.md
├── SECURITY.md
└── TERMS.md
```

---

# 🚀 Getting Started

## Prerequisites

You need:

- A modern web browser
- Python 3.x
- A Firebase project
- A Supabase project

No Node.js installation is required to run the current static frontend.

---

# 💻 Running VEIL Locally

## 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/VEIL.git
```

Enter the project directory:

```bash
cd VEIL
```

---

## 2. Start the Local Server

VEIL uses JavaScript modules and browser APIs, so it should be served through
a local web server instead of being opened directly using `file://`.

Run:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

---

# 🔥 Firebase Configuration

VEIL uses Firebase for:

- Anonymous authentication
- Real-time messaging
- Presence
- Typing indicators
- Room data

## Authentication

Enable anonymous authentication in your Firebase project:

```text
Firebase Console
        ↓
Authentication
        ↓
Sign-in method
        ↓
Anonymous
        ↓
Enable
```

## Realtime Database

Create a Firebase Realtime Database.

The project contains the database rules in:

```text
firebase.database.rules.json
```

Make sure your Firebase Realtime Database rules are configured correctly
before deploying VEIL publicly.

---

# ☁️ Supabase Configuration

Supabase is used for encrypted file and image storage.

Create a Supabase project and create the required storage bucket.

The current application uses:

```text
hashchat-files
```

as the storage bucket.

VEIL uses a **Supabase Publishable Key** for frontend access.

> Never use a Supabase Secret Key or Service Role Key in frontend code.

---

# 💬 Creating a Private Chat

The normal VEIL workflow is:

### 1. Generate a Room

Click:

```text
Generate Private Link
```

VEIL generates a unique private room identifier and room secret.

### 2. Share the Link

Copy the generated private room link and send it to the person you want to
communicate with.

### 3. Open the Link

Both participants can open the same private room.

### 4. Start Chatting

Messages are encrypted in the browser before being written to the real-time
database.

---

# 📎 File Sharing

VEIL supports encrypted file sharing.

The process is:

```text
Select File
     ↓
Validate File
     ↓
Read File
     ↓
Encrypt in Browser
     ↓
Upload Encrypted Data
     ↓
Store Attachment Metadata
     ↓
Recipient Downloads
     ↓
Decrypt in Browser
```

Maximum file size:

```text
10 MB
```

Supported file categories include:

```text
JPEG
PNG
GIF
WebP
PDF
TXT
CSV
ZIP
DOC/DOCX
XLS/XLSX
PPT/PPTX
```

---

# 🔄 Real-Time Architecture

VEIL uses Firebase Realtime Database listeners to synchronize messages.

A simplified database structure is:

```text
rooms/
└── ROOM_ID/
    └── messages/
        ├── MESSAGE_ID/
        │   ├── payload
        │   ├── senderUid
        │   └── timestamp
        │
        └── MESSAGE_ID/
            ├── payload
            ├── senderUid
            └── timestamp
```

The actual message content is stored inside the encrypted `payload`.

---

# 👤 Anonymous Authentication

VEIL does not require users to create a traditional account.

When a user enters a room, Firebase creates an anonymous authentication
session.

The flow is:

```text
User
 │
 ▼
VEIL
 │
 ▼
Firebase Anonymous Authentication
 │
 ▼
Anonymous UID
 │
 ▼
Realtime Database
```

The anonymous UID is used for backend access and message ownership.

It is not displayed as a traditional user identity.

---

# 🛡️ Security Model

VEIL follows a client-side encryption approach.

### Message Flow

```text
User types message
        │
        ▼
      Browser
        │
        ▼
 AES-GCM Encryption
        │
        ▼
Encrypted Payload
        │
        ▼
     Firebase
```

The intended architecture is:

```text
User
 │
 ▼
Browser Encryption
 │
 ▼
Encrypted Payload
 │
 ▼
Backend Storage
```

---

# 🔐 Privacy & Security

VEIL is designed around several privacy principles.

## No Traditional Registration

Users do not need to create an account.

## Anonymous Sessions

Firebase anonymous authentication is used for backend access.

## Client-Side Encryption

Messages and attachments are encrypted in the browser before storage.

## Private Room Links

Rooms are accessed through unique private links containing the room secret.

## No Public Profiles

VEIL does not require usernames, profile pages, or public identities.

---

# ⚠️ Security Disclaimer

VEIL is a student/developer project and has **not undergone a professional
security audit**.

Although the project uses client-side encryption and anonymous access, no
software system should be assumed to provide absolute security.

VEIL should not be relied upon for highly sensitive, classified, financial,
medical, legal, or other high-risk communications.

Users should understand that:

- Browser security still matters.
- Device security still matters.
- Private room links should be kept private.
- Sharing a room link may give another person access to the room.
- Firebase and Supabase security rules must be configured correctly.
- Client-side applications cannot protect against a compromised device or
  browser.
- Network and hosting infrastructure still require appropriate security
  configuration.

---

# 🧹 Room & Message Lifecycle

VEIL is designed around private conversations and temporary rooms.

Room expiration and cleanup behavior depend on the application's room
lifecycle implementation and backend configuration.

Closing a browser tab should not be interpreted as a guaranteed deletion of
all server-side room data.

For explicit room destruction, use the room destruction functionality
provided by the application.

---

# 📱 Progressive Web App

VEIL includes:

```text
manifest.webmanifest
sw.js
icon.svg
```

This allows VEIL to behave like an installable web application on supported
devices and browsers.

---

# 🎨 Design

VEIL uses a modern, minimal interface focused on:

- Privacy
- Simplicity
- Responsive design
- Clear chat interactions
- Mobile usability
- Private room sharing
- Minimal identity requirements

The interface is designed to keep the communication experience simple without
requiring a traditional social-media account system.

---

# 🧪 Local Development

Start the server:

```bash
python -m http.server 8000
```

Open:

```text
http://localhost:8000/
```

After making changes, refresh the browser.

If the application appears to be using an older version, clear the browser
cache and service worker.

---

# 🔧 Troubleshooting

## Messages Are Not Appearing

Check:

1. Firebase Authentication
2. Firebase Realtime Database
3. Firebase database rules
4. Firebase configuration
5. Browser console
6. Internet connection

---

## File Uploads Are Not Working

Check:

1. Supabase project
2. Storage bucket
3. Bucket name
4. Supabase authentication
5. Storage policies
6. File size limit
7. Browser console

The current bucket name is:

```text
hashchat-files
```

---

## Old UI or JavaScript Is Appearing

VEIL uses a service worker.

Try:

```text
Browser DevTools
       ↓
Application
       ↓
Service Workers
       ↓
Unregister
```

Then clear site data and reload the application.

A hard refresh can also be performed with:

```text
Ctrl + Shift + R
```

---

# 🌐 Deployment

VEIL is a static web application and can be deployed to static hosting
platforms.

Possible hosting platforms include:

- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages
- Firebase Hosting

The selected hosting platform must support the application's static files
and HTTPS.

For production deployment, make sure:

- Firebase is configured for the deployed domain.
- Supabase storage policies are configured correctly.
- The production domain is allowed where required.
- HTTPS is enabled.
- Backend security rules are reviewed before public release.

---

# 📸 Screenshots

Add screenshots of your application here.

Recommended screenshots:

1. Landing page
2. Private room creation
3. Chat interface
4. Reply functionality
5. File/image sharing

Example:

```markdown
## 📸 Screenshots

### Landing Page

![VEIL Landing Page](screenshots/landing.png)

### Private Chat

![VEIL Chat](screenshots/chat.png)

### File Sharing

![VEIL File Sharing](screenshots/file-sharing.png)
```

---

# 📌 Roadmap

Potential future improvements:

- [ ] Improved room lifecycle management
- [ ] Better attachment previews
- [ ] Voice messages
- [ ] Optional audio/video communication
- [ ] Improved offline handling
- [ ] Attachment upload progress
- [ ] Advanced message search
- [ ] Improved mobile UX
- [ ] Automated testing
- [ ] Security audit
- [ ] Production deployment
- [ ] Better room administration
- [ ] Improved error handling

---

# 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

## Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/VEIL.git
cd VEIL
```

## Create a Branch

```bash
git checkout -b feature/your-feature
```

## Make Your Changes

Test the application locally:

```bash
python -m http.server 8000
```

## Commit Your Changes

```bash
git add .
git commit -m "Add your feature"
```

## Push Your Branch

```bash
git push origin feature/your-feature
```

Then open a pull request on GitHub.

---

# 📄 License

This project is available under the license specified in the repository.

See:

```text
LICENSE
```

for the complete license terms.

---

# 👨‍💻 Project

**VEIL**

A privacy-focused, anonymous real-time chat application built with modern
web technologies.

---

<p align="center">

<strong>VEIL</strong>

<br><br>

Private conversations.<br>
No accounts.<br>
Just share the room.

</p>
