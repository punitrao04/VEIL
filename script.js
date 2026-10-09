import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
    getDatabase, ref, push, set, get, onValue, onDisconnect, remove,
    serverTimestamp, update
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
const firebaseConfig = {
    apiKey: "AIzaSyB1TOo3eSBAifaQGBXLLjb5orbHhfp629E",
    authDomain: "hashchat04.firebaseapp.com",
    databaseURL: "https://hashchat04-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "hashchat04",
    storageBucket: "hashchat04.firebasestorage.app",
    messagingSenderId: "151440462160",
    appId: "1:151440462160:web:32b33ea11393cb5d2a5c55"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Supabase Storage holds encrypted attachments so HashChat stays on the Firebase Spark plan.
const SUPABASE_URL = "https://veghmhawrujghiizlhun.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_8k-pqnnKfT6Pxi2C0dZooA_v8sIKKEy";
const SUPABASE_BUCKET = "hashchat-files";

let supabasePromise = null;
async function getSupabaseClient() {
    if (!supabasePromise) {
        supabasePromise = import("https://esm.sh/@supabase/supabase-js@2")
            .then(mod => mod.createClient(SUPABASE_URL, SUPABASE_ANON_KEY));
    }
    return supabasePromise;
}

const MAX_MESSAGE_LENGTH = 2000;
const MAX_MESSAGES = 200;
const ROOM_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf", "text/plain", "text/csv", "application/zip",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
];

const EXT_TO_MIME = {
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp",
    ".pdf": "application/pdf", ".txt": "text/plain", ".csv": "text/csv", ".zip": "application/zip",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".ppt": "application/vnd.ms-powerpoint",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation"
};

let roomID = "";
let roomSecret = "";
let myUid = "";
let roomListenerStarted = false;
let presenceRef = null;
let typingRef = null;
let typingTimer = null;
let messagesCache = [];
let unreadCount = 0;
let isInitialMessageLoad = true;
let supabaseUid = "";
let attachmentCache = new Map();
let cryptoKeyCache = {};
let renderToken = 0;

const $ = (id) => document.getElementById(id);

function randomBytesHex(bytes = 16) {
    const data = crypto.getRandomValues(new Uint8Array(bytes));
    return [...data].map(b => b.toString(16).padStart(2, "0")).join("");
}

function randomBase64Url(bytes = 32) {
    const data = crypto.getRandomValues(new Uint8Array(bytes));
    let binary = "";
    data.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function parseRoomHash() {
    const raw = window.location.hash.replace(/^#/, "").trim();
    if (!raw) return null;
    const [id, secret] = raw.split(".");
    if (!/^[A-F0-9]{24}$/i.test(id)) return null;
    return { id: id.toUpperCase(), secret: secret || id.toUpperCase(), legacy: !secret };
}

async function getCryptoKey(secret) {
    if (cryptoKeyCache[secret]) return cryptoKeyCache[secret];
    const encoded = new TextEncoder().encode(secret);
    const hash = await crypto.subtle.digest("SHA-256", encoded);
    const key = await crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
    cryptoKeyCache[secret] = key;
    return key;
}

function bytesToBase64(bytes) {
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    return btoa(binary);
}

function base64ToBytes(value) {
    const binary = atob(value);
    return Uint8Array.from(binary, c => c.charCodeAt(0));
}

async function encryptMessage(text) {
    const key = await getCryptoKey(roomSecret);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(text));
    const combined = new Uint8Array(iv.length + data.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(data), iv.length);
    return bytesToBase64(combined);
}

async function decryptMessage(ciphertext) {
    try {
        const combined = base64ToBytes(ciphertext);
        if (combined.length < 13) throw new Error("Invalid ciphertext");
        const key = await getCryptoKey(roomSecret);
        const iv = combined.slice(0, 12);
        const encrypted = combined.slice(12);
        const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encrypted);
        return new TextDecoder().decode(plain);
    } catch {
        return "🔒 Unable to decrypt this message";
    }
}

async function encryptBytes(bytes) {
    const key = await getCryptoKey(roomSecret);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, bytes);
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);
    return combined;
}

async function decryptBytes(combined) {
    if (combined.length < 13) throw new Error("Invalid ciphertext");
    const key = await getCryptoKey(roomSecret);
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encrypted));
}

async function ensureSupabaseAuth() {
    if (supabaseUid) return;
    const client = await getSupabaseClient();
    const { data, error } = await client.auth.signInAnonymously();
    if (error) throw error;
    supabaseUid = data?.user?.id || "";
}

function isFileAllowed(file) {
    if (!file) return false;
    if (file.type && file.type.startsWith("image/")) return true;
    const mimeOk = ALLOWED_FILE_TYPES.includes(file.type);
    const ext = file.name ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase() : "";
    const extMime = EXT_TO_MIME[ext];
    const extOk = !!extMime && (!file.type || file.type === extMime || file.type === "application/octet-stream");
    return mimeOk || extOk;
}

function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function encryptAndUploadFile(file) {
    const name = (file.name || `screenshot_${Date.now()}.png`).trim();
    const mime = file.type || "image/png";
    const isImage = mime.startsWith("image/");

    const bytes = new Uint8Array(await file.arrayBuffer());
    const encrypted = await encryptBytes(bytes);

    let storagePath = null;
    let dataBase64 = null;

    try {
        const client = await getSupabaseClient();
        await ensureSupabaseAuth();
        const fileId = randomBytesHex(16).toUpperCase();
        const path = `rooms/${roomID}/files/${supabaseUid}/${fileId}`;
        const { error } = await client.storage
            .from(SUPABASE_BUCKET)
            .upload(path, encrypted, { contentType: "application/octet-stream", upsert: false });
        if (!error) {
            storagePath = path;
        } else {
            console.warn("Supabase upload error:", error);
        }
    } catch (e) {
        console.warn("Supabase connection/auth unavailable, using inline encrypted storage:", e);
    }

    if (!storagePath) {
        dataBase64 = bytesToBase64(encrypted);
    }

    const payload = {
        type: isImage ? "image" : "file",
        name,
        mime,
        size: file.size,
        ...(storagePath ? { storagePath } : { data: dataBase64 })
    };

    const encryptedPayload = await encryptMessage(JSON.stringify(payload));
    const messagesRef = ref(db, `rooms/${roomID}/messages`);
    await push(messagesRef, {
        text: encryptedPayload,
        senderUid: myUid,
        timestamp: Date.now()
    });
}

async function handleFileSelect(event) {
    const input = event.target;
    const file = input.files && input.files[0];
    input.value = "";
    if (!file) return;
    if (!isFileAllowed(file)) {
        showToast("File type not supported");
        return;
    }
    if (file.size > MAX_FILE_SIZE) {
        showToast("Files are limited to 10MB");
        return;
    }
    showToast(`Uploading ${file.name}…`);
    try {
        await encryptAndUploadFile(file);
        showToast("File sent");
    } catch (error) {
        console.error(error);
        showToast("Upload failed");
    }
}

async function loadEncryptedAttachment(payload) {
    const cacheKey = payload.storagePath || payload.data;
    if (!cacheKey) throw new Error("Invalid payload");
    const cached = attachmentCache.get(cacheKey);
    if (cached) return cached;

    let decryptedBytes;
    if (payload.data) {
        const encrypted = base64ToBytes(payload.data);
        decryptedBytes = await decryptBytes(encrypted);
    } else {
        const client = await getSupabaseClient();
        await ensureSupabaseAuth();
        const { data, error } = await client.storage.from(SUPABASE_BUCKET).download(payload.storagePath);
        if (error || !data) throw error || new Error("Download failed");
        decryptedBytes = await decryptBytes(new Uint8Array(await data.arrayBuffer()));
    }

    const url = URL.createObjectURL(new Blob([decryptedBytes], { type: payload.mime || "application/octet-stream" }));
    const entry = { url, mime: payload.mime || "application/octet-stream" };
    attachmentCache.set(cacheKey, entry);
    return entry;
}

async function hydrateAttachment(slot, payload, token) {
    try {
        const { url } = await loadEncryptedAttachment(payload);
        if (token !== renderToken || !slot.isConnected) return;
        let node;
        if (payload.type === "image") {
            const img = document.createElement("img");
            img.className = "message-image";
            img.alt = payload.name || "Shared image";
            img.src = url;
            img.addEventListener("click", () => window.open(url, "_blank", "noopener,noreferrer"));
            node = img;
        } else {
            const a = document.createElement("a");
            a.className = "file-card";
            a.href = url;
            a.download = payload.name || "download";
            a.textContent = `${payload.name} · ${formatFileSize(payload.size)}`;
            node = a;
        }
        const caption = document.createElement("div");
        caption.className = "attachment-name";
        caption.textContent = `${payload.name} • ${formatFileSize(payload.size)}`;
        slot.replaceChildren(node, caption);
        slot.classList.remove("attachment-loading");
    } catch (error) {
        console.error("[VEIL] Attachment unavailable:", error);
        if (token === renderToken && slot.isConnected) slot.textContent = "Attachment unavailable";
    }
}

function showChatScreen() {
    $("landing-page").style.display = "none";
    $("chat-page").style.display = "flex";
}

function showLandingScreen() {
    $("chat-page").style.display = "none";
    $("landing-page").style.display = "block";
}

function setStatus(text, online = true) {
    const status = $("connection-status");
    if (!status) return;
    status.textContent = text;
    status.classList.toggle("offline", !online);
}

function updateRoomDisplay() {
    $("room-id-display").textContent = `ROOM ${roomID}`;
    $("hashText").textContent = `${window.location.origin}${window.location.pathname}#${roomID}.${roomSecret}`;
}

async function ensureAuth() {
    if (auth.currentUser) {
        myUid = auth.currentUser.uid;
        return;
    }
    setStatus("Connecting…", true);
    const result = await signInAnonymously(auth);
    myUid = result.user.uid;
}

async function createRoomRecord() {
    const roomRef = ref(db, `rooms/${roomID}`);
    const existing = await get(roomRef);
    if (existing.exists()) return false;
    await set(roomRef, {
        createdAt: serverTimestamp(),
        expiresAt: Date.now() + ROOM_TTL_MS,
        createdBy: myUid
    });
    return true;
}

window.createNewRoom = async function () {
    try {
        await ensureAuth();
        roomID = randomBytesHex(12).toUpperCase();
        roomSecret = randomBase64Url(32);
        while (!(await createRoomRecord())) roomID = randomBytesHex(12).toUpperCase();
        window.location.hash = `${roomID}.${roomSecret}`;
        showChatScreen();
        updateRoomDisplay();
        startRoom();
    } catch (error) {
        console.error(error);
        alert("Unable to create the room. Check Firebase Anonymous Authentication and Realtime Database rules.");
    }
};

async function joinRoom(parsed) {
    roomID = parsed.id;
    roomSecret = parsed.secret;
    await ensureAuth();
    const roomSnapshot = await get(ref(db, `rooms/${roomID}`));
    if (!roomSnapshot.exists()) {
        alert("This room does not exist or has already expired.");
        history.replaceState(null, "", window.location.pathname);
        showLandingScreen();
        return;
    }
    const room = roomSnapshot.val();
    if (room.expiresAt && Date.now() > room.expiresAt) {
        alert("This room has expired.");
        showLandingScreen();
        return;
    }
    showChatScreen();
    updateRoomDisplay();
    startRoom();
}

function startRoom() {
    if (roomListenerStarted) return;
    roomListenerStarted = true;
    setStatus("Connected", true);
    setupPresence();
    listenMessages();
    listenTyping();
    startExpiryTimer();
}

function setupPresence() {
    presenceRef = ref(db, `rooms/${roomID}/presence/${myUid}`);
    const connectedRef = ref(db, ".info/connected");
    onValue(connectedRef, async (snapshot) => {
        if (snapshot.val() === true) {
            await onDisconnect(presenceRef).remove();
            await set(presenceRef, { joinedAt: serverTimestamp() });
            setStatus("Connected", true);
        } else {
            setStatus("Reconnecting…", false);
        }
    });

    onValue(ref(db, `rooms/${roomID}/presence`), snapshot => {
        const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
        $("participant-count").textContent = `${count} ${count === 1 ? "participant" : "participants"}`;
    });

    typingRef = ref(db, `rooms/${roomID}/typing/${myUid}`);
    onDisconnect(typingRef).remove();
}

function listenTyping() {
    onValue(ref(db, `rooms/${roomID}/typing`), snapshot => {
        const users = snapshot.exists() ? Object.keys(snapshot.val()).filter(uid => uid !== myUid) : [];
        const indicator = $("typing-indicator");
        if (users.length === 0) {
            indicator.textContent = "";
            indicator.classList.remove("visible");
        } else {
            indicator.textContent = users.length === 1 ? "Someone is typing…" : `${users.length} people are typing…`;
            indicator.classList.add("visible");
        }
    });
}

function listenMessages() {
    onValue(ref(db, `rooms/${roomID}/messages`), async snapshot => {
        const entries = Object.entries(snapshot.val() || {}).map(([key, val]) => ({ id: key, ...val }));
        entries.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        messagesCache = await Promise.all(entries.slice(-MAX_MESSAGES).map(async msg => {
            const decrypted = await decryptMessage(msg.text);
            let payload = null;
            if (decrypted.startsWith("{")) {
                try {
                    const parsed = JSON.parse(decrypted);
                    if (parsed && typeof parsed === "object" &&
                        typeof parsed.storagePath === "string" &&
                        (parsed.type === "image" || parsed.type === "file")) {
                        payload = parsed;
                    }
                } catch { /* plain text */ }
            }
            return payload ? { ...msg, payload } : { ...msg, plainText: decrypted };
        }));
        renderMessages();

        if (!isInitialMessageLoad) {
            const foreignMessages = messagesCache.filter(m => m.senderUid !== myUid);
            const last = foreignMessages[foreignMessages.length - 1];
            if (last && document.visibilityState !== "visible") {
                unreadCount++;
                document.title = `(${unreadCount}) VEIL`;
            }
        }
        isInitialMessageLoad = false;
    });
}

function renderMessages() {
    const container = $("chat-stream");
    const filter = ($("message-search")?.value || "").trim().toLowerCase();
    const token = ++renderToken;
    container.replaceChildren();

    if (!messagesCache.length) {
        const empty = document.createElement("div");
        empty.className = "empty-chat";
        empty.textContent = "No messages yet. Start the conversation securely.";
        container.appendChild(empty);
        return;
    }

    const slots = [];

    for (const msg of messagesCache) {
        if (filter) {
            const haystack = `${msg.plainText || ""} ${msg.payload ? msg.payload.name : ""}`.toLowerCase();
            if (!haystack.includes(filter)) continue;
        }
        const wrapper = document.createElement("div");
        wrapper.className = `message ${msg.senderUid === myUid ? "outgoing" : "incoming"}`;
        wrapper.dataset.messageId = msg.id;

        const meta = document.createElement("div");
        meta.className = "message-meta";
        const time = document.createElement("span");
        time.className = "message-time";
        time.textContent = new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        meta.appendChild(time);

        const bubble = document.createElement("div");
        bubble.className = "message-bubble";

        let slot = null;
        if (msg.payload) {
            slot = document.createElement("div");
            slot.className = "attachment-loading";
            slot.textContent = "Decrypting attachment…";
            bubble.appendChild(slot);
            slots.push({ slot, payload: msg.payload });
        } else {
            bubble.textContent = msg.plainText;
        }

        const actions = document.createElement("div");
        actions.className = "message-actions";
        if (!msg.payload) {
            const copy = document.createElement("button");
            copy.textContent = "Copy";
            copy.onclick = () => navigator.clipboard.writeText(msg.plainText).catch(() => {});
            actions.appendChild(copy);
        }
        if (msg.senderUid === myUid) {
            const del = document.createElement("button");
            del.textContent = "Delete";
            del.onclick = () => deleteMessage(msg.id);
            actions.appendChild(del);
        }

        wrapper.append(meta, bubble, actions);
        container.appendChild(wrapper);
    }

    for (const { slot, payload } of slots) hydrateAttachment(slot, payload, token);
    container.scrollTop = container.scrollHeight;
}

async function deleteMessage(id) {
    try { await remove(ref(db, `rooms/${roomID}/messages/${id}`)); }
    catch (error) { console.error(error); }
}

window.sendMessage = async function () {
    const input = $("message-input");
    const message = input.value.trim();
    if (!message || message.length > MAX_MESSAGE_LENGTH) return;
    input.value = "";
    await stopTyping();

    try {
        const encrypted = await encryptMessage(message);
        const messagesRef = ref(db, `rooms/${roomID}/messages`);
        await push(messagesRef, {
            text: encrypted,
            senderUid: myUid,
            timestamp: Date.now()
        });
    } catch (error) {
        console.error(error);
        input.value = message;
        alert("Message could not be sent.");
    }
};

async function setTyping() {
    if (!typingRef || !myUid) return;
    await set(typingRef, { at: serverTimestamp() });
    clearTimeout(typingTimer);
    typingTimer = setTimeout(stopTyping, 1200);
}

async function stopTyping() {
    clearTimeout(typingTimer);
    if (typingRef) await remove(typingRef).catch(() => {});
}

function startExpiryTimer() {
    const expiryRef = ref(db, `rooms/${roomID}/expiresAt`);
    onValue(expiryRef, snapshot => {
        const expiresAt = snapshot.val();
        if (!expiresAt) return;
        const updateTimer = () => {
            const remaining = Math.max(0, expiresAt - Date.now());
            const hours = Math.floor(remaining / 3600000);
            const minutes = Math.floor((remaining % 3600000) / 60000);
            $("expiry-timer").textContent = `Expires in ${hours}h ${minutes}m`;
            if (remaining <= 0) {
                alert("This room has expired.");
                leaveRoom();
            }
        };
        updateTimer();
        setInterval(updateTimer, 30000);
    });
}

window.copyHash = async function () {
    try {
        await navigator.clipboard.writeText(window.location.href);
        showToast("Private link copied");
    } catch { alert("Copy failed. Please copy the URL manually."); }
};

window.destroyRoom = async function () {
    if (!confirm("Destroy this room for everyone? This deletes the encrypted room data.")) return;
    try {
        await remove(ref(db, `rooms/${roomID}`));
        leaveRoom(false);
        showToast("Room destroyed");
    } catch (error) {
        console.error(error);
        alert("Only the room creator can destroy this room.");
    }
};

window.leaveRoom = function (clearRemote = true) {
    if (clearRemote) {
        if (presenceRef) remove(presenceRef).catch(() => {});
        if (typingRef) remove(typingRef).catch(() => {});
    }
    renderToken++;
    for (const { url } of attachmentCache.values()) URL.revokeObjectURL(url);
    attachmentCache.clear();
    supabaseUid = "";
    roomID = "";
    roomSecret = "";
    roomListenerStarted = false;
    messagesCache = [];
    window.location.hash = "";
    showLandingScreen();
};

function showToast(text) {
    let toast = $("toast");
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 1800);
}

window.toggleMobileMenu = function () {
    document.querySelector('.hamburger')?.classList.toggle('active');
    document.querySelector('.mobile-menu-overlay')?.classList.toggle('active');
    document.querySelector('.mobile-nav')?.classList.toggle('active');
};

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
        unreadCount = 0;
        document.title = "VEIL";
    }
});

$("message-input")?.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        window.sendMessage();
    }
});
$("message-input")?.addEventListener("input", () => {
    if ($("message-input").value.trim()) setTyping();
    else stopTyping();
});
$("message-search")?.addEventListener("input", renderMessages);
$("attach-btn")?.addEventListener("click", () => $("file-input")?.click());
$("file-input")?.addEventListener("change", handleFileSelect);
$("clear-search")?.addEventListener("click", () => {
    $("message-search").value = "";
    renderMessages();
});

$("message-input")?.addEventListener("paste", e => {
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
        if (items[i].kind === "file") {
            const blob = items[i].getAsFile();
            if (blob) {
                e.preventDefault();
                const ext = (blob.type || "image/png").split("/")[1] || "png";
                const namedFile = new File([blob], `screenshot_${Date.now()}.${ext}`, { type: blob.type || "image/png" });
                if (!isFileAllowed(namedFile)) {
                    showToast("File type not supported");
                    return;
                }
                if (namedFile.size > MAX_FILE_SIZE) {
                    showToast("Files are limited to 10MB");
                    return;
                }
                showToast("Uploading screenshot…");
                encryptAndUploadFile(namedFile).then(() => {
                    showToast("Screenshot sent");
                }).catch(err => {
                    console.error(err);
                    showToast("Upload failed");
                });
            }
        }
    }
});

document.querySelector('.mobile-menu-overlay')?.addEventListener('click', window.toggleMobileMenu);

async function init() {
    try {
        await ensureAuth();
        const parsed = parseRoomHash();
        if (parsed) await joinRoom(parsed);
    } catch (error) {
        console.error(error);
        setStatus("Offline", false);
    }
}

init();