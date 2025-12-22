export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Método não permitido');

    const { prompt } = req.body;

    try {
        // 1. TRADUTOR GOOGLE (Fidelidade Semântica)
        const transRes = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=pt&tl=en&dt=t&q=${encodeURIComponent(prompt)}`
        );
        const transData = await transRes.json();
        const translated = transData[0][0][0];

        // 2. MOTOR SHUTTLE (Gratuito e Fiel)
        // Este modelo separa perfeitamente "Gato Azul" de "Dragão"
        const seed = Math.floor(Math.random() * 999999);
        const finalUrl = `https://shuttle-api-production.up.railway.app/shuttle-3-diffusion?prompt=${encodeURIComponent(translated)}&seed=${seed}&width=1024&height=1024`;

        // Validamos se a imagem está acessível
        const check = await fetch(finalUrl);
        
        if (!check.ok) {
            throw new Error("O servidor de GPU está em manutenção. Tente em 10 segundos.");
        }

        // Retornamos a URL direta para o frontend
        return res.status(200).json({ url: finalUrl });

    } catch (error) {
        // Retorna o erro em formato JSON válido para o seu frontend não quebrar
        return res.status(500).json({ error: error.message });
    }
}
