// This is the corrected server-side function.
// It properly handles binary audio data for Netlify.
exports.handler = async function (event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { text, voiceId } = JSON.parse(event.body);
        
        if (!text || !voiceId) {
            return { statusCode: 400, body: 'Missing text or voiceId in request body' };
        }

        const apiKey = process.env.ELEVENLABS_API_KEY;

        if (!apiKey) {
            console.error('ELEVENLABS_API_KEY is not set in environment variables.');
            return { statusCode: 500, body: 'Audio API key is not configured.' };
        }

        const apiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': apiKey,
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
                },
            }),
        });

        if (!response.ok) {
            const errorDetails = await response.text();
            console.error(`ElevenLabs API Error (${response.status}):`, errorDetails);
            return { statusCode: response.status, body: `Failed to generate audio. Details: ${errorDetails}` };
        }

        // Convert the audio response into a Base64 string.
        const audioBuffer = await response.arrayBuffer();
        const audioBase64 = Buffer.from(audioBuffer).toString('base64');

        // Return the Base64-encoded audio data.
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'audio/mpeg',
            },
            body: audioBase64,
            isBase64Encoded: true, // This tells Netlify to handle the body as binary data.
        };

    } catch (error) {
        console.error('Function Error:', error);
        return { statusCode: 500, body: 'An internal error occurred in the elevenlabs function.' };
    }
};
