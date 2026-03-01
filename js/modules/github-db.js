// /js/modules/github-db.js
export async function saveMatchToGitHub(matchData) {
    try {
        console.log("☁️ [DB] Syncing via Bouncer...");
        const response = await fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(matchData)
        });
        if (response.ok) console.log("✅ [DB] Match saved to GitHub Cloud.");
    } catch (e) {
        console.error("❌ [DB] Sync error:", e);
    }
}