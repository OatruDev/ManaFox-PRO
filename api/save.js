// /api/save.js

export default async function handler(req, res) {
    // Seguridad de cabeceras
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Leemos la Bóveda
    const token = process.env.GITHUB_TOKEN;
    const REPO_OWNER = process.env.GITHUB_USER;
    
    // Si tu repo en GitHub se llama distinto, puedes añadir GITHUB_REPO en las variables de entorno de Vercel
    const REPO_NAME = process.env.GITHUB_REPO || 'ManaFox'; 
    const FILE_PATH = 'db.json';

    if (!token || !REPO_OWNER) {
        return res.status(500).json({ error: 'Vault configuration missing (Missing GITHUB_TOKEN or GITHUB_USER)' });
    }

    try {
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
        const headers = { 
            'Authorization': `Bearer ${token}`, 
            'Content-Type': 'application/json', 
            'Accept': 'application/vnd.github.v3+json' 
        };

        // 1. Intentamos leer el archivo actual
        const getRes = await fetch(url, { headers });
        let currentContent = [];
        let sha = null;

        if (getRes.ok) {
            const data = await getRes.json();
            sha = data.sha;
            // FIX: Decodificación robusta para servidor (Soporta UTF-8, Emojis, Acentos)
            const decodedText = Buffer.from(data.content, 'base64').toString('utf8');
            currentContent = JSON.parse(decodedText);
            if (!Array.isArray(currentContent)) currentContent = [];
        } else if (getRes.status !== 404) {
            // Si el error no es 404 (Archivo no encontrado), paramos y enviamos el error.
            const errData = await getRes.json();
            return res.status(500).json({ error: `GitHub Read API Error: ${getRes.status} - ${JSON.stringify(errData)}` });
        }

        // 2. Inyectamos la partida nueva
        currentContent.unshift(req.body);

        // 3. FIX: Codificación a Base64 indestructible de servidor
        const jsonString = JSON.stringify(currentContent, null, 2);
        const contentEncoded = Buffer.from(jsonString, 'utf8').toString('base64');

        const body = { 
            message: `db: Automated Match Log via Bouncer`, 
            content: contentEncoded 
        };
        if (sha) body.sha = sha;

        // 4. Escribimos la partida en GitHub
        const putRes = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(body) });
        
        if (!putRes.ok) {
            const errData = await putRes.json();
            return res.status(500).json({ error: `GitHub Write API Error: ${putRes.status} - ${JSON.stringify(errData)}` });
        }

        return res.status(200).json({ success: true, message: 'Match completely secured.' });
        
    } catch (error) {
        return res.status(500).json({ error: `Internal Server Error: ${error.message}` });
    }
}