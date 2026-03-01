// /api/save.js

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // DIAGNÓSTICO DE BÓVEDA
    const keys = Object.keys(process.env);
    const hasToken = keys.includes('GITHUB_TOKEN');
    const hasUser = keys.includes('GITHUB_USER');

    if (!hasToken || !hasUser) {
        return res.status(500).json({ 
            error: 'Vault Error', 
            details: `Present keys: ${keys.filter(k => k.includes('GITHUB')).join(', ') || 'None'}. Missing: ${!hasToken ? 'GITHUB_TOKEN ' : ''}${!hasUser ? 'GITHUB_USER' : ''}`
        });
    }

    const token = process.env.GITHUB_TOKEN;
    const REPO_OWNER = process.env.GITHUB_USER;
    const REPO_NAME = process.env.GITHUB_REPO || 'ManaFox'; 
    const FILE_PATH = 'db.json';

    try {
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
        const headers = { 
            'Authorization': `Bearer ${token}`, 
            'Content-Type': 'application/json', 
            'Accept': 'application/vnd.github.v3+json' 
        };

        // 1. Leer db.json
        const getRes = await fetch(url, { headers });
        let currentContent = [];
        let sha = null;

        if (getRes.ok) {
            const data = await getRes.json();
            sha = data.sha;
            const decodedText = Buffer.from(data.content, 'base64').toString('utf8');
            currentContent = JSON.parse(decodedText);
        }

        // 2. Inyectar partida
        currentContent.unshift(req.body);

        // 3. Codificar y Guardar
        const jsonString = JSON.stringify(currentContent, null, 2);
        const contentEncoded = Buffer.from(jsonString, 'utf8').toString('base64');

        const body = { 
            message: `db: match ${req.body.id || 'auto'}`, 
            content: contentEncoded 
        };
        if (sha) body.sha = sha;

        const putRes = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(body) });
        
        if (!putRes.ok) {
            const errData = await putRes.json();
            return res.status(500).json({ error: 'GitHub Push Failed', github_msg: errData.message });
        }

        return res.status(200).json({ success: true });
        
    } catch (error) {
        return res.status(500).json({ error: 'Server Crash', msg: error.message });
    }
}