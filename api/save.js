// /api/save.js

export default async function handler(req, res) {
    // 1. Medidas de seguridad básicas
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // 2. Extraemos el Token de la bóveda segura de Vercel
    const token = process.env.GITHUB_TOKEN;
    const REPO_OWNER = process.env.GITHUB_USER; // Tu usuario
    const REPO_NAME = 'ManaFox';
    const FILE_PATH = 'db.json';

    if (!token || !REPO_OWNER) {
        return res.status(500).json({ error: 'Server vault misconfiguration' });
    }

    try {
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
        const headers = { 
            'Authorization': `Bearer ${token}`, 
            'Content-Type': 'application/json', 
            'Accept': 'application/vnd.github.v3+json' 
        };

        // 3. Descargamos la base de datos actual a puerta cerrada
        const getRes = await fetch(url, { headers });
        let currentContent = [];
        let sha = null;

        if (getRes.ok) {
            const data = await getRes.json();
            sha = data.sha;
            currentContent = JSON.parse(decodeURIComponent(escape(atob(data.content))));
            if (!Array.isArray(currentContent)) currentContent = [];
        }

        // 4. Inyectamos la partida
        currentContent.unshift(req.body);

        // 5. Empaquetamos y guardamos en GitHub
        const contentEncoded = btoa(unescape(encodeURIComponent(JSON.stringify(currentContent, null, 2))));
        const body = { message: `db: Automated Match Log via Bouncer`, content: contentEncoded };
        if (sha) body.sha = sha;

        const putRes = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(body) });
        if (!putRes.ok) throw new Error("GitHub rejected the write request");

        return res.status(200).json({ success: true, message: 'Match completely secured.' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}