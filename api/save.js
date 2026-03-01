// /api/save.js
export default async function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const token = process.env.GITHUB_TOKEN;
    const REPO_OWNER = process.env.GITHUB_USER;
    const REPO_NAME = 'ManaFox';
    const FILE_PATH = 'db.json';

    try {
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
        const headers = { 
            'Authorization': `Bearer ${token}`, 
            'Content-Type': 'application/json', 
            'Accept': 'application/vnd.github.v3+json' 
        };

        const getRes = await fetch(url, { headers });
        let currentContent = [];
        let sha = null;

        if (getRes.ok) {
            const data = await getRes.json();
            sha = data.sha;
            const decoded = decodeURIComponent(escape(atob(data.content)));
            currentContent = JSON.parse(decoded);
        }

        currentContent.unshift(req.body);

        const contentEncoded = btoa(unescape(encodeURIComponent(JSON.stringify(currentContent, null, 2))));
        const body = { message: `db: Log match ${req.body.id}`, content: contentEncoded };
        if (sha) body.sha = sha;

        const putRes = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(body) });
        if (!putRes.ok) throw new Error("GitHub Sync Failed");

        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}