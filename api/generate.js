export const config = {
  maxDuration: 60, // Define o máximo de 60 segundos para o plano Hobby
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Método não permitido');

    const { prompt } = req.body;
    const HF_TOKEN = process.env.HF_TOKEN;

    try {
        const response = await fetch(
            "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
            {
                headers: { 
                    Authorization: `Bearer ${HF_TOKEN}`,
                    "Content-Type": "application/json"
                },
                method: "POST",
                body: JSON.stringify({ 
                    inputs: prompt,
                    parameters: { wait_for_model: true } 
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json({ error: errorData.error || "Erro no Hugging Face" });
        }

        const buffer = await response.arrayBuffer();
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'no-store, max-age=0');
        return res.send(Buffer.from(buffer));

    } catch (error) {
        return res.status(500).json({ error: "Erro interno: " + error.message });
    }
}
