export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Método não permitido');

    const { prompt } = req.body;
    const HF_TOKEN = process.env.HF_TOKEN;

    try {
        // 1. TRADUÇÃO COM REFORÇO SEMÂNTICO
        // Isso garante que "montado em" não vire "misturado com"
        const transRes = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=pt&tl=en&dt=t&q=${encodeURIComponent(prompt)}`
        );
        const transData = await transRes.json();
        const translated = transData[0][0][0];

        // 2. CHAMADA AO ROUTER (FLUX.1-PRO)
        // Usamos o endpoint de inferência direta que é o mais robusto do HF
        const response = await fetch(
            "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-pro",
            {
                headers: { 
                    "Authorization": `Bearer ${HF_TOKEN}`,
                    "Content-Type": "application/json",
                    "x-use-cache": "false",
                    "x-wait-for-model": "true"
                },
                method: "POST",
                body: JSON.stringify({ 
                    inputs: translated,
                    parameters: {
                        guidance_scale: 7.5, // Obediência absoluta ao texto
                        num_inference_steps: 50 // Qualidade máxima de detalhes
                    }
                }),
            }
        );

        if (!response.ok) {
            const errorMsg = await response.text();
            return res.status(response.status).json({ error: errorMsg });
        }

        const arrayBuffer = await response.arrayBuffer();
        res.setHeader('Content-Type', 'image/png');
        return res.send(Buffer.from(arrayBuffer));

    } catch (error) {
        return res.status(500).json({ error: "Erro na Engine: " + error.message });
    }
}
