exports.handler = async function (event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { history } = JSON.parse(event.body);

        if (!history || history.length === 0) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Conversation history is empty.' }) };
        }

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error('GEMINI_API_KEY is not set in environment variables.');
            return { statusCode: 500, body: JSON.stringify({ error: 'API key is not configured.' }) };
        }
        
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

        const payload = {
            contents: history,
        };
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API Error:', errorData);
            return { statusCode: response.status, body: JSON.stringify(errorData) };
        }

        const data = await response.json();
        
        const aiText = data.candidates[0]?.content?.parts[0]?.text || "Sorry, I encountered a problem and couldn't generate a response.";

        return {
            statusCode: 200,
            body: JSON.stringify({ text: aiText }),
        };

    } catch (error) {
        console.error('Function Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'An internal error occurred in the gemini function.' }),
        };
    }
};
