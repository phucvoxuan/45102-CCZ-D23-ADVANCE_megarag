/**
 * Script to trigger entity re-extraction via API
 * Usage: node scripts/reprocess-entities.js [documentId]
 */

const documentId = process.argv[2] || null;

async function reprocessEntities() {
  console.log('=== Re-processing Entities ===\n');
  console.log('Document ID:', documentId || 'ALL documents');
  console.log('API URL: http://localhost:3000/api/admin/reprocess-entities\n');

  try {
    // First check current status
    console.log('--- Current Status ---');
    const statusRes = await fetch('http://localhost:3000/api/admin/reprocess-entities', {
      method: 'GET',
      headers: {
        'Cookie': 'sb-access-token=YOUR_TOKEN_HERE', // Will need real auth
      },
    });

    if (!statusRes.ok) {
      console.log('Status check failed - this is expected without auth');
      console.log('Please run the re-extraction from the browser or use curl with auth cookies\n');
    }

    console.log('\n--- To trigger re-extraction ---');
    console.log('Option 1: Use browser console while logged in:');
    console.log('');
    console.log('  fetch("/api/admin/reprocess-entities", {');
    console.log('    method: "POST",');
    console.log('    headers: { "Content-Type": "application/json" },');
    if (documentId) {
      console.log('    body: JSON.stringify({ documentId: "' + documentId + '" })');
    } else {
      console.log('    body: JSON.stringify({})');
    }
    console.log('  }).then(r => r.json()).then(console.log)');
    console.log('');
    console.log('Option 2: Use curl with your session cookie:');
    console.log('');
    console.log('  curl -X POST http://localhost:3000/api/admin/reprocess-entities \\');
    console.log('    -H "Content-Type: application/json" \\');
    console.log('    -H "Cookie: YOUR_SESSION_COOKIE" \\');
    if (documentId) {
      console.log('    -d \'{"documentId":"' + documentId + '"}\'');
    } else {
      console.log('    -d \'{}\'');
    }
    console.log('');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

reprocessEntities();
