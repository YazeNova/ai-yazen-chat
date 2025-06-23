// netlify/functions/elevenlabs.js

const fetch = require('node-fetch'); // Required for making HTTP requests in Netlify Functions

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }

    try {
        const { text, voiceId } = JSON.parse(event.body);

        // Retrieve the ElevenLabs API Key from environment variables
        // IMPORTANT: You MUST set a Netlify environment variable named ELEVENLABS_API_KEY
        const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

        if (!ELEVENLABS_API_KEY) {
            console.error('ELEVENLABS_API_KEY environment variable is not set.');
            return {
                statusCode: 500,
                body: JSON.stringify({ message: 'ElevenLabs API key not configured on server.' }),
            };
        }

        if (!text || !voiceId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing text or voiceId in request body.' }),
            };
        }

        const elevenLabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;

        const response = await fetch(elevenLabsUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY, // Use your ElevenLabs API Key
                'Accept': 'audio/mpeg'
            },
            body: JSON.stringify({
                text: text,
                model_id: "eleven_multilingual_v2", // Or "eleven_turbo_v2" or "eleven_monolingual_v1" based on your preference/model availability
                voice_settings: {
                    stability: 0.75,
                    similarity_boost: 0.75
                }
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`ElevenLabs API Error: ${response.status} - ${errorBody}`);
            return {
                statusCode: response.status,
                body: JSON.stringify({ message: `ElevenLabs API error: ${response.statusText}`, details: errorBody }),
            };
        }

        // Convert the audio stream to a Buffer and then to base64 for direct response
        // Note: For large audio files, streaming directly might be more efficient,
        // but for short chat responses, this approach is fine.
        const audioBuffer = await response.buffer();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'audio/mpeg',
                'Cache-Control': 'no-cache, no-store, must-revalidate' // Prevent caching audio
            },
            body: audioBuffer.toString('base64'), // Send audio as base64
            isBase64Encoded: true // Tell Netlify the body is base64 encoded
        };

    } catch (error) {
        console.error('Error in ElevenLabs Netlify Function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error processing ElevenLabs request.' }),
        };
    }
};
