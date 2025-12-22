export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Método não permitido');

    const { prompt } = req.body;
    const HF_TOKEN = process.env.HF_TOKEN;

    try {
        // 1. TRADUTOR INTEGRADO (Google)
        const transRes = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=pt&tl=en&dt=t&q=${encodeURIComponent(prompt)}`
        );
        const transData = await transRes.json();
        const translatedPrompt = transData[0][0][0];

        // 2. CHAMADA AO ROUTER (URL DIRETA)
        // Esta URL é a única que o Router aceita para o Flux sem retornar "Not Found"
        const response = await fetch(
            "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-dev",
            {
                headers: { 
                    "Authorization": `Bearer ${HF_TOKEN}`,
                    "Content-Type": "application/json",
                    "x-use-cache": "false",
                    "x-wait-for-model": "true"
                },
                method: "POST",
                body: JSON.stringify({ 
                    inputs: translatedPrompt,
                    parameters: {
                        guidance_scale: 5.0, // Alta fidelidade ao prompt
                        num_inference_steps: 28
                    }
                }),
            }
        );

        // Proteção contra o erro "Not Found"
        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ error: errorText });
        }

        // 3. RESPOSTA BINÁRIA (A imagem real)
        const arrayBuffer = await response.arrayBuffer();
        res.setHeader('Content-Type', 'image/png');
        return res.send(Buffer.from(arrayBuffer));

    } catch (error) {
        return res.status(500).json({ error: "Erro na Engine: " + error.message });
    }
}
