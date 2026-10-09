# VEIL

> Private conversations. No accounts. Just share the room.

VEIL is a privacy-focused, anonymous real-time chat application that lets users create private chat rooms and communicate without traditional registration.

Messages are encrypted on the client side before being stored, and users can share a private room link with another person to start a conversation.

## ✨ Features

- 🔐 Client-side AES-GCM encryption
- 👤 Anonymous authentication
- 🚪 Private room generation
- 🔗 Shareable private room links
- 💬 Real-time messaging
- ↩️ Reply to messages
- 🗑️ Delete your own messages
- 🖼️ Image sharing
- 📎 File sharing
- ⌨️ Typing indicators
- 🟢 Online presence
- 📱 Responsive interface
- ⚡ No traditional account registration
- 📲 Progressive Web App support

## 🛠️ Tech Stack

### Frontend
- HTML5
- CSS3
- JavaScript
- Web Crypto API

### Backend / Services
- Firebase Authentication
- Firebase Realtime Database
- Supabase Storage

### Deployment
- Static web hosting
- Progressive Web App

## 🔒 Privacy & Security

VEIL is designed around privacy.

Room secrets are contained in the private room URL and are used by the client to derive the encryption key. Messages are encrypted in the browser before being written to the database.

The application uses anonymous authentication only for access to backend services.

> VEIL is a student/developer project and has not undergone a professional security audit. It should not be used for highly sensitive communications.

## 🚀 Running Locally

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/VEIL.git
cd VEIL
