import Replicate from "replicate";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ success: false, error: "Prompt tidak boleh kosong" });
  }

  try {
    const apiKey = process.env.REPLICATE_API_TOKEN;
    
    if (!apiKey) {
      throw new Error(
        "REPLICATE_API_TOKEN belum dikonfigurasi di Environment Variables Vercel."
      );
    }

    const replicate = new Replicate({
      auth: apiKey,
    });

    const output = await replicate.run(
      "alibaba/happyhorse-1.0",
      {
        input: { prompt }
      }
    );

    let mediaUrl = "";
    if (Array.isArray(output) && output.length > 0) {
      mediaUrl = typeof output[0]?.url === 'function' ? output[0].url().toString() : String(output[0]);
    } else if (typeof output === 'string') {
      mediaUrl = output;
    } else if (output && typeof output === 'object') {
      const anyOutput: any = output;
      if (typeof anyOutput.url === 'function') {
         mediaUrl = anyOutput.url().toString();
      } else {
         mediaUrl = anyOutput.url || anyOutput.uri || String(output);
      }
    } else {
      mediaUrl = String(output);
    }

    if (!mediaUrl) {
      throw new Error("Gagal menghasilkan video dari Replicate API.");
    }

    return res.status(200).json({ success: true, media_url: mediaUrl, type: 'video' });

  } catch (error: any) {
    console.error("Error generating video on Vercel:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
