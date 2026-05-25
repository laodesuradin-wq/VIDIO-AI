import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Replicate from "replicate";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Endpoint untuk generate video
  app.post("/api/generate", async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, error: "Prompt tidak boleh kosong" });
    }

    try {
      const apiKey = process.env.REPLICATE_API_TOKEN;
      
      if (!apiKey) {
        // Fallback untuk demo jika token tidak ada
        console.log("REPLICATE_API_TOKEN tidak ditemukan, menggunakan fallback demo video.");
        
        // Simulasi waktu proses 4 detik
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        return res.json({ 
          success: true, 
          // Video sampel beresolusi HD untuk preview yang menarik
          video_url: "https://www.w3schools.com/html/mov_bbb.mp4" 
        });
      }

      // Menggunakan Replicate API jika token tersedia
      const replicate = new Replicate({
        auth: apiKey,
      });

      console.log(`Generating video using Replicate for prompt: "${prompt}"...`);
      console.log(`Membutuhkan waktu 1-3 menit, harap tunggu...`);

      // Menggunakan model flux-2-pro sesuai instruksi
      const output = await replicate.run(
        "black-forest-labs/flux-2-pro",
        {
          input: {
            prompt: prompt,
            resolution: "1 MP",
            aspect_ratio: "1:1",
            output_format: "webp",
            output_quality: 80,
            safety_tolerance: 2
          }
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

      console.log("Berhasil dibuat! Output:", mediaUrl);

      return res.json({ success: true, video_url: mediaUrl, media_url: mediaUrl, type: 'image' });

    } catch (error: any) {
      console.error("Error generating video:", error);
      return res.status(500).json({ success: false, error: error.message });
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
