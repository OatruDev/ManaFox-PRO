// /js/modules/github-db.js

export async function saveMatchToGitHub(matchData) {
    try {
        console.log("☁️ [DB] Handing match data over to secure Bouncer...");
        
        // Llamamos al "Bouncer" (Backend) en lugar de a GitHub directamente
        const response = await fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(matchData)
        });

        if (!response.ok) {
            throw new Error("Bouncer encountered an error.");
        }
        
        console.log("✅ [DB] Match successfully immortalized via Serverless Proxy!");
    } catch (error) {
        console.error("❌ [DB] Proxy Sync Error:", error);
    }
}