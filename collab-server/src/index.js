require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const Y = require("yjs");
const syncProtocol = require("y-protocols/sync");
const awarenessProtocol = require("y-protocols/awareness");
const encoding = require("lib0/encoding");
const decoding = require("lib0/decoding");
const mongoose = require("mongoose");

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.DATABASE_URL;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

// ─────────────────────────────────────────────
// MongoDB Schema (persist Yjs doc state)
// ─────────────────────────────────────────────
const docStateSchema = new mongoose.Schema({
  roomName: { type: String, unique: true, index: true },
  state: Buffer,
  updatedAt: { type: Date, default: Date.now },
});
const DocState = mongoose.model("DocState", docStateSchema);

async function loadDoc(roomName) {
  try {
    const record = await DocState.findOne({ roomName });
    return record ? record.state : null;
  } catch (e) {
    console.error("[DB] loadDoc error:", e.message);
    return null;
  }
}

async function persistDoc(roomName, state) {
  try {
    await DocState.findOneAndUpdate(
      { roomName },
      { state, updatedAt: new Date() },
      { upsert: true, new: true },
    );
  } catch (e) {
    console.error("[DB] persistDoc error:", e.message);
  }
}

// ─────────────────────────────────────────────
// In-memory rooms
// ─────────────────────────────────────────────
// rooms: Map<roomName, { doc: Y.Doc, awareness: awarenessProtocol.Awareness, clients: Set<ws>, persistTimer: NodeJS.Timeout }>
const rooms = new Map();

async function getOrCreateRoom(roomName) {
  if (rooms.has(roomName)) return rooms.get(roomName);

  const doc = new Y.Doc();
  const awareness = new awarenessProtocol.Awareness(doc);

  // Load persisted state
  const savedState = await loadDoc(roomName);
  if (savedState) {
    Y.applyUpdate(doc, savedState);
  }

  // Persist on every doc update (debounced 2s)
  let persistTimer = null;
  doc.on("update", () => {
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      persistDoc(roomName, Buffer.from(Y.encodeStateAsUpdate(doc)));
    }, 2000);
  });

  const room = { doc, awareness, clients: new Set(), persistTimer };
  rooms.set(roomName, room);
  return room;
}

function closeRoom(roomName) {
  const room = rooms.get(roomName);
  if (!room) return;
  if (room.persistTimer) clearTimeout(room.persistTimer);
  // Final persist
  persistDoc(roomName, Buffer.from(Y.encodeStateAsUpdate(room.doc)));
  room.doc.destroy();
  rooms.delete(roomName);
}

// ─────────────────────────────────────────────
// Protocol constants (matches y-websocket)
// ─────────────────────────────────────────────
const messageSync = 0;
const messageAwareness = 1;
const messageSignal = 2; // Custom: WebRTC signaling

// ─────────────────────────────────────────────
// Express + HTTP server
// ─────────────────────────────────────────────
const app = express();
app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json());

app.get("/health", (_, res) => res.json({ status: "ok", rooms: rooms.size }));

const server = http.createServer(app);

// ─────────────────────────────────────────────
// WebSocket server
// ─────────────────────────────────────────────
const wss = new WebSocket.Server({ server });

wss.on("connection", async (ws, req) => {
  // URL format: ws://host:4000/?room=<roomName>&userId=<userId>
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const roomName = url.searchParams.get("room");
  const userId = url.searchParams.get("userId") || "anonymous";
  const yjsClientId = parseInt(url.searchParams.get("clientId") || "0", 10);

  if (!roomName) {
    ws.close(4000, "Missing room param");
    return;
  }

  const room = await getOrCreateRoom(roomName);
  room.clients.add(ws);
  ws.roomName = roomName;
  ws.userId = userId;
  ws.yjsClientId = yjsClientId;

  console.log(
    `[WS] Connected: userId=${userId} room=${roomName} total=${room.clients.size}`,
  );

  // ── Send initial sync (Step 1) ──────────────────────────
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageSync);
  syncProtocol.writeSyncStep1(encoder, room.doc);
  ws.send(encoding.toUint8Array(encoder));

  // ── Send current awareness ──────────────────────────────
  const awarenessStates = room.awareness.getStates();
  if (awarenessStates.size > 0) {
    const enc2 = encoding.createEncoder();
    encoding.writeVarUint(enc2, messageAwareness);
    encoding.writeVarUint8Array(
      enc2,
      awarenessProtocol.encodeAwarenessUpdate(
        room.awareness,
        Array.from(awarenessStates.keys()),
      ),
    );
    ws.send(encoding.toUint8Array(enc2));
  }

  // ── Message handler ──────────────────────────────────────
  ws.on("message", (rawData) => {
    try {
      const data = new Uint8Array(rawData);
      const decoder = decoding.createDecoder(data);
      const msgType = decoding.readVarUint(decoder);

      if (msgType === messageSync) {
        const replyEncoder = encoding.createEncoder();
        encoding.writeVarUint(replyEncoder, messageSync);
        const syncType = syncProtocol.readSyncMessage(
          decoder,
          replyEncoder,
          room.doc,
          ws,
        );

        // Step 1 (type 0): reply with step 2 containing all missing updates
        if (syncType === 0) {
          ws.send(encoding.toUint8Array(replyEncoder));
        }

        // Update (type 2): broadcast raw message to all other clients
        if (syncType === 2) {
          room.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(data);
            }
          });
        }
        // Step 2 (type 1): already applied to doc, no further action needed
      } else if (msgType === messageAwareness) {
        const awarenessUpdate = decoding.readVarUint8Array(decoder);
        awarenessProtocol.applyAwarenessUpdate(
          room.awareness,
          awarenessUpdate,
          ws,
        );
        // Broadcast awareness to all others
        room.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            const enc = encoding.createEncoder();
            encoding.writeVarUint(enc, messageAwareness);
            encoding.writeVarUint8Array(enc, awarenessUpdate);
            client.send(encoding.toUint8Array(enc));
          }
        });
      } else if (msgType === messageSignal) {
        // WebRTC signaling: forward to specific peer
        const targetId = decoding.readVarString(decoder);
        const signal = decoding.readVarString(decoder);
        room.clients.forEach((client) => {
          if (
            client !== ws &&
            client.userId === targetId &&
            client.readyState === WebSocket.OPEN
          ) {
            const enc = encoding.createEncoder();
            encoding.writeVarUint(enc, messageSignal);
            encoding.writeVarString(enc, ws.userId); // from
            encoding.writeVarString(enc, signal); // payload
            client.send(encoding.toUint8Array(enc));
          }
        });
      }
    } catch (err) {
      console.error("[WS] message error:", err.message);
    }
  });

  // ── Close handler ────────────────────────────────────────
  ws.on("close", () => {
    room.clients.delete(ws);
    console.log(
      `[WS] Disconnected: userId=${userId} room=${roomName} remaining=${room.clients.size}`,
    );

    // Remove awareness for the disconnecting client
    if (ws.yjsClientId) {
      awarenessProtocol.removeAwarenessStates(
        room.awareness,
        [ws.yjsClientId],
        "disconnect",
      );
    }

    // If room is empty, close it after 30s (give time for reconnect)
    if (room.clients.size === 0) {
      setTimeout(() => {
        if (rooms.has(roomName) && rooms.get(roomName).clients.size === 0) {
          closeRoom(roomName);
          console.log(`[Room] Closed empty room: ${roomName}`);
        }
      }, 30000);
    }
  });

  ws.on("error", (err) => {
    console.error(`[WS] Error userId=${userId}:`, err.message);
  });
});

// ─────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────
async function start() {
  if (MONGO_URI) {
    try {
      await mongoose.connect(MONGO_URI);
      console.log("[DB] MongoDB connected");
    } catch (e) {
      console.warn(
        "[DB] MongoDB connection failed (running without persistence):",
        e.message,
      );
    }
  } else {
    console.warn("[DB] DATABASE_URL not set — running without persistence");
  }

  server.listen(PORT, () => {
    console.log(`[Server] Collab server running on port ${PORT}`);
  });
}

start();
