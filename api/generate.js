export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Método não permitido');

    const { prompt } = req.body;
    const HF_TOKEN = process.env.HF_TOKEN;

    try {
        const response = await fetch(
            "https://router.huggingface.co/hf-inference/v1/chat/completions",
            {
                headers: { 
                    "Authorization": `Bearer ${HF_TOKEN}`,
                    "Content-Type": "application/json"
                },
                method: "POST",
                body: JSON.stringify({ 
                    model: "openai/dall-e-3", // O modelo mais fiel a prompts literais
                    messages: [
                        { role: "user", content: `Generate a high-quality image based on this exact prompt: ${prompt}` }
                    ]
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({ error: data.error || "Erro no Router" });
        }

        // Retorna o JSON com a URL da imagem gerada pelo Router
        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ error: "Falha Crítica: " + error.message });
    }
}
