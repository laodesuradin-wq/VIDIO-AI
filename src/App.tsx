/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useRef } from 'react';
import { Clapperboard, Download, Loader2 } from 'lucide-react';

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("none");
  const [status, setStatus] = useState("Menunggu input...");
  const [isLoading, setIsLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string>("video");
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert("Tulis dulu ide karyanya!");
      return;
    }

    setStatus("Mengirim permintaan ke AI...");
    setIsLoading(true);
    setVideoUrl(null);

    let finalPrompt = prompt.trim();
    if (style !== "none") {
      finalPrompt = `${finalPrompt}, ${style} style`;
    }

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: finalPrompt })
      });
      const data = await response.json();

      if (data.success && (data.video_url || data.media_url)) {
        setStatus("Berhasil dibuat!");
        setVideoUrl(data.media_url || data.video_url);
        setMediaType(data.type || 'video');
        if (data.type !== 'image' && videoRef.current) {
          videoRef.current.load();
        }
      } else {
        setStatus("Gagal: " + (data.error || "Terjadi kesalahan pada server."));
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      setStatus("Error: Pastikan server (Node.js) sudah dijalankan!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!videoUrl) {
      alert("Belum ada karya yang siap!");
      return;
    }
    const link = document.createElement("a");
    link.href = videoUrl;
    link.download = mediaType === 'image' ? "karya-gambar-ai.webp" : "karya-video-ai.mp4";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans p-6 md:p-10 flex items-center justify-center">
      <div className="w-full max-w-3xl bg-slate-950 p-6 md:p-8 rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.5)]">
        <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3 mb-6">
          <Clapperboard className="text-blue-500 w-8 h-8" /> Pembuat Visual AI
        </h2>

        <div className="mb-4">
          <p className="mb-2 text-slate-300 font-medium">Masukkan ide karya kamu:</p>
          <textarea
            className="w-full h-32 rounded-xl p-4 bg-slate-900 text-white border border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-y"
            placeholder="Contoh: Seekor naga terbang di atas pegunungan bersalju, pencahayaan sinematik, resolusi 4K..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <p className="mb-2 text-slate-300 font-medium">Pilih Gaya Visual:</p>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="w-full p-3.5 rounded-xl bg-slate-900 text-white border border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
          >
            <option value="none">Tidak ada (Bawaan)</option>
            <option value="Cinematic">Sinematik</option>
            <option value="Cartoon">Kartun</option>
            <option value="Realistic">Realistis</option>
            <option value="Anime">Anime</option>
          </select>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className={`w-full py-3.5 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
            isLoading 
              ? 'bg-slate-600 text-slate-300 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin w-5 h-5" />
              Menghasilkan Karya...
            </>
          ) : (
            'Buat Visual'
          )}
        </button>

        {isLoading && (
          <div className="mt-6 bg-slate-800 p-4 rounded-xl text-center flex items-center justify-center gap-3">
            <Loader2 className="animate-spin w-6 h-6 text-blue-500" />
            <span className="text-slate-300">AI sedang memproses karyamu, mohon tunggu...</span>
          </div>
        )}

        <div className="mt-8">
          <h3 className="text-slate-400 font-semibold mb-2">Status:</h3>
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-slate-200">
            {status}
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-slate-400 font-semibold mb-3">Pratinjau Hasil</h3>
          <div className="w-full rounded-xl border-2 border-blue-600/50 bg-black overflow-hidden relative aspect-video flex items-center justify-center">
            {videoUrl ? (
              mediaType === 'image' || videoUrl.endsWith('.webp') || videoUrl.endsWith('.jpg') || videoUrl.endsWith('.png') ? (
                <img
                  src={videoUrl}
                  alt="Pratinjau Hasil"
                  className="w-full h-full object-contain"
                />
              ) : (
                <video
                  ref={videoRef}
                  controls
                  className="w-full h-full object-contain"
                  src={videoUrl}
                >
                  Browser kamu tidak mendukung tag video.
                </video>
              )
            ) : (
              <div className="text-slate-600">Pratinjau belum tersedia</div>
            )}
          </div>
        </div>

        {videoUrl && !isLoading && (
          <button
             onClick={handleDownload}
             className="w-full mt-6 bg-green-600 hover:bg-green-700 py-3.5 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 text-white shadow-lg shadow-green-900/20"
          >
             <Download className="w-5 h-5" /> Download Hasil
          </button>
        )}
      </div>
    </div>
  );
}
