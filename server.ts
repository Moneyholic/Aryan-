import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Create HTTP server to attach WebSocket server
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Attach WebSocket Server
  const wss = new WebSocketServer({ server });

  // Keep track of connected clients
  const clients = new Set<WebSocket>();

  wss.on("connection", (ws) => {
    console.log("New client connected");
    clients.add(ws);

    ws.on("message", (message) => {
      // Broadcast the message to all OTHER connected clients
      // This allows the Extension (Tab 1) to talk to the App (Tab 2)
      const messageStr = message.toString();
      
      clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(messageStr);
        }
      });
    });

    ws.on("close", () => {
      console.log("Client disconnected");
      clients.delete(ws);
    });
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

startServer();
