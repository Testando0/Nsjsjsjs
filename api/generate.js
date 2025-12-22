export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Método não permitido');

    const { prompt } = req.body;
    const HF_TOKEN = process.env.HF_TOKEN;

    try {
        // 1. TRADUTOR AUTOMÁTICO (Google Translate)
        const transRes = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=pt&tl=en&dt=t&q=${encodeURIComponent(prompt)}`
        );
        const transData = await transRes.json();
        const translatedPrompt = transData[0][0][0];

        // 2. CHAMADA AO NOVO ROUTER (Padronizado)
        // Usamos o endpoint v1/images/generations que é o padrão do router.huggingface.co
        const response = await fetch(
            "https://router.huggingface.co/hf-inference/v1/images/generations",
            {
                headers: { 
                    "Authorization": `Bearer ${HF_TOKEN}`,
                    "Content-Type": "application/json"
                },
                method: "POST",
                body: JSON.stringify({ 
                    model: "black-forest-labs/FLUX.1-dev", // Modelo de alta fidelidade
                    prompt: translatedPrompt,
                    parameters: {
                        guidance_scale: 5.0, // Força a obediência ao prompt (azul/voando/dragão)
                        num_inference_steps: 28
                    }
                }),
            }
        );

        const result = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({ error: result.error || "Erro no Router" });
        }

        // O Router retorna um JSON com a imagem em base64 ou URL
        // Vamos enviar o JSON direto para o frontend tratar
        return res.status(200).json(result);

    } catch (error) {
        return res.status(500).json({ error: "Falha na Engine: " + error.message });
    }
}
