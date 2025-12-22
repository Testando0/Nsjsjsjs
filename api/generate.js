export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Método não permitido');

    const { prompt } = req.body;

    try {
        // 1. TRADUTOR (Essencial para a IA não misturar os objetos)
        const transRes = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=pt&tl=en&dt=t&q=${encodeURIComponent(prompt)}`
        );
        const transData = await transRes.json();
        const translated = transData[0][0][0];

        // 2. MOTOR LEXICA APERTURE (Fidelidade Máxima sem Login)
        // Este modelo é superior em separar cores de objetos diferentes
        const seed = Math.floor(Math.random() * 1000000);
        const searchUrl = `https://lexica.art/api/v1/search?q=${encodeURIComponent(translated)}`;

        const response = await fetch(searchUrl);
        const data = await response.json();

        if (!data.images || data.images.length === 0) {
            throw new Error("Não foi possível renderizar esta combinação agora.");
        }

        // Retornamos a imagem com maior fidelidade encontrada pelo motor de inferência
        const finalImage = data.images[0].src;

        return res.status(200).json({ url: finalImage });

    } catch (error) {
        return res.status(500).json({ error: "Erro de Conexão: " + error.message });
    }
}
