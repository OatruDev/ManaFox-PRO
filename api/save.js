// /api/save.js

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const token = process.env.GITHUB_TOKEN?.trim();
    const REPO_OWNER = process.env.GITHUB_USER?.trim();
    
    // 🔥 EL ARREGLO ESTÁ AQUÍ: Le decimos exactamente cómo se llama tu repo
    const REPO_NAME = 'ManaFox-PRO'; 
    const FILE_PATH = 'db.json';

    if (!token || !REPO_OWNER) {
        return res.status(500).json({ error: 'Vault Error', details: 'Keys missing in Vercel' });
    }

    try {
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
        const headers = { 
            'Authorization': `Bearer ${token}`, 
            'Content-Type': 'application/json', 
            'Accept': 'application/vnd.github.v3+json' 
        };

        // 1. Leer el archivo
        const getRes = await fetch(url, { headers });
        let currentContent = [];
        let sha = null;

        if (getRes.ok) {
            const data = await getRes.json();
            sha = data.sha;
            const decodedText = Buffer.from(data.content, 'base64').toString('utf8');
            currentContent = JSON.parse(decodedText);
        } else if (getRes.status !== 404) {
            const errData = await getRes.json().catch(() => ({}));
            return res.status(500).json({ error: 'GitHub Read Failed', details: errData.message || `HTTP ${getRes.status}` });
        }

        // 2. Guardar partida
        currentContent.unshift(req.body);
        const jsonString = JSON.stringify(currentContent, null, 2);
        const contentEncoded = Buffer.from(jsonString, 'utf8').toString('base64');

        const body = { message: `db: match ${req.body.id || 'auto'}`, content: contentEncoded };
        if (sha) body.sha = sha;

        const putRes = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(body) });
        
        if (!putRes.ok) {
            const errData = await putRes.json().catch(() => ({}));
            return res.status(500).json({ error: 'GitHub Push Failed', details: errData.message || `HTTP ${putRes.status}` });
        }

        return res.status(200).json({ success: true });
        
    } catch (error) {
        return res.status(500).json({ error: 'Server Crash', details: error.message });
    }
}