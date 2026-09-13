import http from "node:http";
import { URL } from "node:url";
import {
  getChannelStates,
  setChannelVolumeFromApi,
  setChannelMuteFromApi,
  triggerReplayFromApi,
  triggerScreenshotFromApi,
} from "../shortcuts.js";

const DEFAULT_PORT = 4848;
let serverInstance: http.Server | null = null;
let activePort = DEFAULT_PORT;

interface JsonBody {
  [key: string]: any;
}

function parseBody(req: http.IncomingMessage): Promise<JsonBody> {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1e6) req.destroy();
    });
    req.on("end", () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

function sendJson(res: http.ServerResponse, statusCode: number, data: any): void {
  const payload = JSON.stringify(data, null, 2);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(payload);
}

export function startLocalServer(port: number = DEFAULT_PORT): Promise<number> {
  if (serverInstance) {
    return Promise.resolve(activePort);
  }

  return new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      // CORS pre-flight
      if (req.method === "OPTIONS") {
        res.writeHead(204, {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        });
        res.end();
        return;
      }

      const parsedUrl = new URL(req.url || "/", "http://127.0.0.1:" + port);
      const pathname = parsedUrl.pathname.toLowerCase().replace(/\/+$/, "");
      const params = Object.fromEntries(parsedUrl.searchParams.entries());

      try {
        // 1. Status / Health
        if (pathname === "" || pathname === "/api" || pathname === "/api/status" || pathname === "/api/health") {
          return sendJson(res, 200, {
            status: "online",
            app: "Serenity Hub",
            version: "1.1.0",
            port: activePort,
            endpoints: [
              "GET  /api/mixer",
              "POST /api/mixer/volume   { channel, target, volume, delta }",
              "GET  /api/mixer/volume?channel=game&target=stream&volume=70",
              "POST /api/mixer/mute     { channel, target, muted }",
              "GET  /api/mixer/mute?channel=chat&target=headphone",
              "POST /api/clips/replay   { duration }",
              "GET  /api/clips/replay?duration=30",
              "POST /api/clips/screenshot",
              "GET  /api/clips/screenshot",
            ],
          });
        }

        // 2. GET /api/mixer : État complet de tous les canaux
        if (pathname === "/api/mixer" && req.method === "GET") {
          const channels = getChannelStates();
          return sendJson(res, 200, {
            success: true,
            channels,
          });
        }

        // 3. /api/mixer/volume (POST ou GET avec query params)
        if (pathname === "/api/mixer/volume") {
          const body = req.method === "POST" ? await parseBody(req) : {};
          const channel = (body.channel || params.channel || "master") as string;
          const target = ((body.target || params.target || "both") as string).toLowerCase() as "headphone" | "stream" | "both";

          let volume: number | undefined;
          if (body.volume !== undefined) volume = Number(body.volume);
          else if (params.volume !== undefined) volume = Number(params.volume);

          let delta: number | undefined;
          if (body.delta !== undefined) delta = Number(body.delta);
          else if (params.delta !== undefined) delta = Number(params.delta);

          const updatedState = await setChannelVolumeFromApi(channel, target, volume, delta);
          if (!updatedState) {
            return sendJson(res, 404, {
              success: false,
              error: "Channel '" + channel + "' introuvable",
            });
          }

          return sendJson(res, 200, {
            success: true,
            channel,
            target,
            state: updatedState,
          });
        }

        // 4. /api/mixer/mute (POST ou GET avec query params)
        if (pathname === "/api/mixer/mute") {
          const body = req.method === "POST" ? await parseBody(req) : {};
          const channel = (body.channel || params.channel || "master") as string;
          const target = ((body.target || params.target || "both") as string).toLowerCase() as "headphone" | "stream" | "both";

          let isMuted: boolean | undefined;
          if (body.muted !== undefined) isMuted = Boolean(body.muted);
          else if (params.muted !== undefined) isMuted = params.muted === "true" || params.muted === "1";

          const updatedState = await setChannelMuteFromApi(channel, target, isMuted);
          if (!updatedState) {
            return sendJson(res, 404, {
              success: false,
              error: "Channel '" + channel + "' introuvable",
            });
          }

          return sendJson(res, 200, {
            success: true,
            channel,
            target,
            state: updatedState,
          });
        }

        // 5. /api/clips/replay (POST ou GET)
        if (pathname === "/api/clips/replay") {
          const body = req.method === "POST" ? await parseBody(req) : {};
          const duration = Number(body.duration || params.duration) || 30;
          await triggerReplayFromApi(duration);
          return sendJson(res, 200, {
            success: true,
            action: "replay",
            duration,
          });
        }

        // 6. /api/clips/screenshot (POST ou GET)
        if (pathname === "/api/clips/screenshot") {
          const item = await triggerScreenshotFromApi();
          return sendJson(res, 200, {
            success: true,
            action: "screenshot",
            item,
          });
        }

        return sendJson(res, 404, {
          error: "Endpoint not found",
          status: 404,
        });
      } catch (err: any) {
        return sendJson(res, 500, {
          error: "Internal Server Error",
          message: err?.message || String(err),
        });
      }
    });

    server.on("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        console.warn("[LocalApi] Port " + port + " is in use, trying " + (port + 1) + "...");
        server.listen(port + 1, "127.0.0.1");
        activePort = port + 1;
      } else {
        console.error("[LocalApi] Server error:", err);
      }
    });

    server.listen(port, "127.0.0.1", () => {
      activePort = port;
      serverInstance = server;
      console.log("[LocalApi] Serenity Local API listening at http://127.0.0.1:" + activePort);
      resolve(activePort);
    });
  });
}

export function stopLocalServer(): void {
  if (serverInstance) {
    serverInstance.close();
    serverInstance = null;
    console.log("[LocalApi] Serenity Local API stopped");
  }
}
