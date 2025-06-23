// netlify/functions/elevenlabs.js

const fetch = require('node-fetch'); // Required for making HTTP requests in Netlify Functions

exports.handler = async (event, context) => {
    // This function handles requests to convert text to speech using ElevenLabs API.

    // Only allow POST requests for security and functionality reasons.
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405, // Method Not Allowed
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }

    try {
        // Parse the request body to get the text and voiceId.
        const { text, voiceId } = JSON.parse(event.body);

        // Retrieve the ElevenLabs API Key from Netlify's environment variables.
        // This key MUST be set in your Netlify site settings for security.
        const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

        // Check if the API key is set. If not, return a server error.
        if (!ELEVENLABS_API_KEY) {
            console.error('ELEVENLABS_API_KEY environment variable is not set.');
            return {
                statusCode: 500, // Internal Server Error
                body: JSON.stringify({ message: 'ElevenLabs API key not configured on the server.' }),
            };
        }

        // Validate that text and voiceId are provided in the request.
        if (!text || !voiceId) {
            return {
                statusCode: 400, // Bad Request
                body: JSON.stringify({ message: 'Missing text or voiceId in request body.' }),
            };
        }

        // Construct the ElevenLabs API URL for text-to-speech streaming.
        const elevenLabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;

        // Make the POST request to the ElevenLabs API.
        const response = await fetch(elevenLabsUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY, // Authenticate with your API Key
                'Accept': 'audio/mpeg' // Request audio in MPEG format
            },
            body: JSON.stringify({
                text: text,
                model_id: "eleven_multilingual_v2", // Specify the voice model. Adjust if you use a different model.
                voice_settings: {
                    stability: 0.75, // Voice consistency
                    similarity_boost: 0.75 // How much the voice resembles the original
                }
            })
        });

        // Check if the ElevenLabs API call was successful.
        if (!response.ok) {
            const errorBody = await response.text(); // Get detailed error message from ElevenLabs
            console.error(`ElevenLabs API Error: ${response.status} - ${errorBody}`);
            return {
                statusCode: response.status, // Pass through ElevenLabs' HTTP status code
                body: JSON.stringify({ message: `ElevenLabs API error: ${response.statusText}`, details: errorBody }),
            };
        }

        // Read the audio stream into a Buffer.
        const audioBuffer = await response.buffer();

        // Return the audio buffer as a base64 encoded string.
        // Netlify Functions support returning binary data this way.
        return {
            statusCode: 200, // OK
            headers: {
                'Content-Type': 'audio/mpeg', // Inform the client it's an audio file
                'Cache-Control': 'no-cache, no-store, must-revalidate' // Prevent aggressive caching of audio
            },
            body: audioBuffer.toString('base64'), // The audio data itself, base64 encoded
            isBase64Encoded: true // Flag for Netlify to decode the body before sending
        };

    } catch (error) {
        // Catch any unexpected errors during function execution.
        console.error('Error in ElevenLabs Netlify Function:', error);
        return {
            statusCode: 500, // Internal Server Error
            body: JSON.stringify({ message: 'Internal server error processing ElevenLabs request.' }),
        };
    }
};
