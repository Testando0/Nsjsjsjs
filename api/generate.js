export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Método não permitido');

    const { prompt } = req.body;
    const HF_TOKEN = process.env.HF_TOKEN;

    try {
        // 1. TRADUTOR GOOGLE (Fidelidade Semântica)
        const transRes = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=pt&tl=en&dt=t&q=${encodeURIComponent(prompt)}`
        );
        const transData = await transRes.json();
        const translated = transData[0][0][0];

        // 2. REFORÇO DE PROMPT (Engenharia de Prompt Invisível)
        const finalPrompt = `${translated}, highly detailed, cinematic photorealism, 8k, masterpiece, distinct subjects, no blending.`;

        // 3. CHAMADA AO ROUTER (ESTABILIDADE MÁXIMA)
        // Usamos o SDXL 1.0 que é o mais fiel a prompts literais
        const response = await fetch(
            "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0",
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
                        guidance_scale: 12.5, // VALOR AGRESSIVO: Força a IA a seguir o texto e ignorar "criatividade"
                        num_inference_steps: 40,
                        negative_prompt: "deformed, blurry, bad anatomy, merged subjects, wings on cat unless specified"
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
