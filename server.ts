import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Endpoint untuk generate media
  app.post("/api/generate", async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, error: "Prompt tidak boleh kosong" });
    }

    try {
      const apiKey = process.env.REPLICATE_API_TOKEN;
      
      if (!apiKey) {
        throw new Error(
          "REPLICATE_API_TOKEN belum dikonfigurasi. " +
          "Tambahkan kunci Replicate pada tab Settings > Secrets untuk fitur pembuatan video, karena API Gemini saat ini tidak mendukung Text-to-Video."
        );
      }

      console.log(`Generating video using Replicate for prompt: "${prompt}"...`);
      
      const Replicate = (await import("replicate")).default;
      const replicate = new Replicate({
        auth: apiKey,
      });

      const output = await replicate.run(
        "minimax/video-01",
        {
          input: { prompt }
        }
      );

      let mediaUrl = "";
      if (Array.isArray(output) && output.length > 0) {
        mediaUrl = typeof output[0]?.url === 'function' ? output[0].url().href : String(output[0]);
      } else if (typeof output === 'string') {
        mediaUrl = output;
      } else if (output && typeof output === 'object') {
        const anyOutput: any = output;
        if (typeof anyOutput.url === 'function') {
           mediaUrl = anyOutput.url().href;
        } else {
           mediaUrl = anyOutput.url || anyOutput.uri || String(output);
        }
      } else {
        mediaUrl = String(output);
      }

      if (!mediaUrl) {
        throw new Error("Gagal menghasilkan video dari Replicate API.");
      }

      console.log("Berhasil dihasilkan!");

      return res.json({ success: true, media_url: mediaUrl, type: 'video' });

    } catch (error: any) {
      console.error("Error generating media:", error);
      
      let errorMessage = error.message;
      if (errorMessage.includes("429") || errorMessage.includes("Quota exceeded") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
        errorMessage = "Kuota API Gemini Anda telah habis atau fitur pembuatan gambar belum tersedia di versi gratis (Free Tier). Anda perlu menambahkan detail tagihan (billing) di konsol Google Cloud/AI Studio Anda untuk menggunakan fitur ini.";
      }

      return res.status(500).json({ success: false, error: errorMessage });
    }
  });

  // Vite middleware untuk rendering Next/React
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server Express jalan port http://localhost:${PORT}`);
  });
}

startServer();
