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

      // Menggunakan model luma/ray atau minimax/video-01
      const output = await replicate.run(
        "minimax/video-01",
        {
          input: { prompt }
        }
      );
      
      let videoUrl = "";
      if (Array.isArray(output) && output.length > 0) {
        videoUrl = output[0];
      } else if (typeof output === 'string') {
        videoUrl = output;
      } else if (output && typeof output === 'object') {
        // Safe check for Replicate URL objects or wrappers
        const anyOutput: any = output;
        videoUrl = anyOutput.url || anyOutput.uri || (Array.isArray(anyOutput) ? anyOutput[0] : String(output));
      }

      if (!videoUrl) {
        // @ts-ignore
        videoUrl = typeof output !== 'undefined' ? String(output) : "";
      }

      console.log("Video berhasil dibuat!");

      return res.json({ success: true, video_url: videoUrl });

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
