export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Método não permitido');

    const { prompt } = req.body;
    const HF_TOKEN = process.env.HF_TOKEN;

    try {
        // URL DO ROUTER (GATEWAY DE ROTEAMENTO DINÂMICO)
        // Note que não usamos mais "api-inference"
        const response = await fetch(
            "https://router.huggingface.co/hf-inference/v1/images/generations",
            {
                headers: { 
                    "Authorization": `Bearer ${HF_TOKEN}`,
                    "Content-Type": "application/json"
                },
                method: "POST",
                body: JSON.stringify({ 
                    model: "black-forest-labs/FLUX.1-schnell",
                    prompt: prompt,
                    parameters: {
                        num_inference_steps: 4
                    }
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({ 
                error: data.error || "Erro no Router Gateway" 
            });
        }

        // O Router retorna o formato padrão de JSON (data[0].b64_json ou url)
        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ error: "Falha Crítica no Router: " + error.message });
    }
}
