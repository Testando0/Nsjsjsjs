export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Método não permitido');

    const { prompt } = req.body;
    const HF_TOKEN = process.env.HF_TOKEN;

    try {
        // 1. TRADUTOR COM REFORÇO DE ESTRUTURA
        const transRes = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=pt&tl=en&dt=t&q=${encodeURIComponent(prompt)}`
        );
        const transData = await transRes.json();
        let englishPrompt = transData[0][0][0];

        // Injeção de fidelidade para evitar "gato com asas"
        const finalPrompt = `Extreme photorealism, exact composition: ${englishPrompt}. Ensure all subjects are distinct and separate as described.`;

        // 2. CHAMADA AO ROUTER (FLUX.1-PRO)
        // O modelo [pro] é o topo da cadeia para obedecer cada vírgula.
        const response = await fetch(
            "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-pro",
            {
                headers: { 
                    "Authorization": `Bearer ${HF_TOKEN}`,
                    "Content-Type": "application/json",
                    "x-use-cache": "false",
                    "x-wait-for-model": "true"
                },
                method: "POST",
                body: JSON.stringify({ 
                    inputs: finalPrompt,
                    parameters: {
                        guidance_scale: 7.5, // Máxima obediência ao texto
                        num_inference_steps: 40, // Refinamento máximo de detalhes
                    }
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ error: errorText });
        }

        const arrayBuffer = await response.arrayBuffer();
        res.setHeader('Content-Type', 'image/png');
        return res.send(Buffer.from(arrayBuffer));

    } catch (error) {
        return res.status(500).json({ error: "Erro na Engine: " + error.message });
    }
}
