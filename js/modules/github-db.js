// /js/modules/github-db.js

export async function saveMatchToGitHub(matchData) {
    try {
        console.log("☁️ [DB] Handing match data over to secure Bouncer...");
        
        const response = await fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(matchData)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            // Aquí está la magia: ahora imprimirá los DETALLES exactos
            throw new Error(`Bouncer crashed: ${errData.error}. Details: ${errData.details || 'None'}`);
        }
        
        console.log("✅ [DB] Match successfully immortalized via Serverless Proxy!");
    } catch (error) {
        console.error("❌ [DB] Proxy Sync Error:", error.message);
    }
}