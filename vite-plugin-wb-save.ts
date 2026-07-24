import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

const SCENE_KEY_RE = /^[a-z0-9][a-z0-9-]{0,120}$/;

function layoutsDir(root: string) {
  return path.join(root, "src/whiteboard/saved-layouts");
}

function readBody(req: import("node:http").IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

/** DEV-only: POST/DELETE layout JSON under src/whiteboard/saved-layouts/ */
export function whiteboardSavePlugin(): Plugin {
  return {
    name: "reasonboard-wb-save",
    configureServer(server) {
      const dir = layoutsDir(server.config.root);
      fs.mkdirSync(dir, { recursive: true });

      server.middlewares.use("/__wb-save", async (req, res, next) => {
        if (req.method !== "POST" && req.method !== "DELETE") {
          next();
          return;
        }

        try {
          if (req.method === "POST") {
            const raw = await readBody(req);
            const data = JSON.parse(raw) as {
              version?: number;
              sceneKey?: string;
              items?: unknown;
              camera?: unknown;
            };
            const sceneKey = data.sceneKey;
            if (!sceneKey || !SCENE_KEY_RE.test(sceneKey)) {
              res.statusCode = 400;
              res.end("Invalid sceneKey");
              return;
            }
            if (data.version !== 1 || !Array.isArray(data.items)) {
              res.statusCode = 400;
              res.end("Invalid body");
              return;
            }
            if (data.camera != null) {
              const cam = data.camera as Record<string, unknown>;
              const scale = Number(cam.scale);
              const x = Number(cam.x);
              const y = Number(cam.y);
              if (
                !Number.isFinite(scale) ||
                scale <= 0 ||
                !Number.isFinite(x) ||
                !Number.isFinite(y)
              ) {
                res.statusCode = 400;
                res.end("Invalid camera");
                return;
              }
              data.camera = { scale, x, y };
            }
            const file = path.join(dir, `${sceneKey}.json`);
            fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true, sceneKey }));
            return;
          }

          const url = new URL(req.url ?? "", "http://localhost");
          const sceneKey = url.searchParams.get("key") ?? "";
          if (!SCENE_KEY_RE.test(sceneKey)) {
            res.statusCode = 400;
            res.end("Invalid sceneKey");
            return;
          }
          const file = path.join(dir, `${sceneKey}.json`);
          if (fs.existsSync(file)) fs.unlinkSync(file);
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: true, sceneKey }));
        } catch (err) {
          res.statusCode = 500;
          res.end(err instanceof Error ? err.message : "Save error");
        }
      });
    },
  };
}
