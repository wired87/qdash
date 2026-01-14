const fs = require('fs');
const path = require('path');
const https = require('https');

// Read .env
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.error(".env file not found");
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
let apiKey = null;
envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('CLIENT_KEY_GEMINI_API_KEY=')) {
        apiKey = trimmed.split('=')[1].trim();
    } else if (trimmed.startsWith('GEMINI_API_KEY=') && !apiKey) {
        apiKey = trimmed.split('=')[1].trim();
    }
});

if (!apiKey) {
    console.error("No API Key found in .env");
    process.exit(1);
}

console.log("Using API Key:", apiKey.substring(0, 10) + "...");

console.log("Fetching available models from API...");
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);

            if (json.error) {
                console.error("API Error:", JSON.stringify(json.error, null, 2));
                fs.writeFileSync('available_models.txt', "API Error: " + JSON.stringify(json.error, null, 2));
            } else if (json.models) {
                console.log("\n✅ Available Models (saved to available_models.txt)");
                const modelNames = json.models
                    .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
                    .map(m => m.name.replace('models/', ''));

                fs.writeFileSync('available_models.txt', modelNames.join('\n'));
                console.log(modelNames.join('\n'));
            } else {

                console.log("Unexpected response:", data);
            }
        } catch (e) {
            console.log("Raw Response:", data);
        }
    });
}).on('error', (err) => {
    console.error("Error listing models:", err.message);
});
