export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Método não permitido');

    const { prompt } = req.body;
    const HF_TOKEN = process.env.HF_TOKEN;

    try {
        const response = await fetch(
            "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell",
            {
                headers: { 
                    "Authorization": `Bearer ${HF_TOKEN}`,
                    "Content-Type": "application/json",
                    "x-use-cache": "false", // Crucial: Obriga o Router a gerar do zero
                    "x-wait-for-model": "true"
                },
                method: "POST",
                body: JSON.stringify({ 
                    inputs: prompt,
                    parameters: {
                        // Aumentamos o Guidance Scale para forçar a cor azul e a ação de voar
                        guidance_scale: 4.0,
                        num_inference_steps: 4
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
        return res.status(500).json({ error: "Erro no Router: " + error.message });
    }
}
