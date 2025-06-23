// netlify/functions/verify-passcode.js

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }

    try {
        const data = JSON.parse(event.body);
        const enteredPasscode = data.passcode;

        // Retrieve the secure passcode from environment variables
        // IMPORTANT: You MUST set a Netlify environment variable named SECURE_PASSCODE
        // in your Netlify site settings.
        const correctPasscode = process.env.SECURE_PASSCODE;

        if (!correctPasscode) {
            console.error('SECURE_PASSCODE environment variable is not set in Netlify.');
            return {
                statusCode: 500,
                body: JSON.stringify({ success: false, message: 'Server configuration error.' }),
            };
        }

        if (enteredPasscode === correctPasscode) {
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, message: 'Passcode verified successfully.' }),
            };
        } else {
            return {
                statusCode: 401, // Unauthorized
                body: JSON.stringify({ success: false, message: 'Incorrect passcode.' }),
            };
        }
    } catch (error) {
        console.error('Error in verify-passcode Netlify Function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: 'An unexpected error occurred.' }),
        };
    }
};
