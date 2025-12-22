export const config = {
  maxDuration: 60,
};

async function queryModel(modelUrl, payload) {
    const response = await fetch(modelUrl, {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Model Busy");
    return await response.arrayBuffer();
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Método não permitido');

    const { prompt } = req.body;

    try {
        // 1. TRADUTOR GOOGLE (Essencial para não confundir a IA)
        const transRes = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=pt&tl=en&dt=t&q=${encodeURIComponent(prompt)}`
        );
        const transData = await transRes.json();
        const translated = transData[0][0][0];

        const payload = {
            inputs: `${translated}, photorealistic, ultra-detailed, 8k, sharp focus`,
            parameters: { guidance_scale: 10, negative_prompt: "merged subjects, blurry, deformed" }
        };

        let imageBuffer;
        try {
            // TENTA MOTOR 1: SDXL 1.0 (Realismo Master)
            imageBuffer = await queryModel(
                "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
                payload
            );
        } catch (e) {
            // TENTA MOTOR 2: Kandinsky 3.0 (Fidelidade Semântica)
            imageBuffer = await queryModel(
                "https://api-inference.huggingface.co/models/kandinsky-community/kandinsky-3",
                payload
            );
        }

        res.setHeader('Content-Type', 'image/png');
        return res.send(Buffer.from(imageBuffer));

    } catch (error) {
        return res.status(500).json({ error: "Ambas as Engines estão congestionadas. Tente novamente em alguns segundos." });
    }
}
