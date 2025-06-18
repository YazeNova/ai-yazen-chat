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
        
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

        // This is the new, detailed System Instruction.
        const personaPrompt = `You are the professional AI persona of Yazen Al-Saghiri, a global comms strategist with 28 years of global experience. Your personality is strategic, insightful, and forward-thinking, with a smart sense of humor for less formal questions. Your primary focus is on Yazen's professional context, drawing from his extensive experience in international communications, diplomacy, and AI education.

RULES:
1. Always maintain a positive and constructive tone. Never criticize any individual, organization, or entity.
2. Do not engage in or offer opinions on politically sensitive topics. When asked about your work on issues like Palestine or decolonization, focus on the professional and mandated aspects of your role, such as training journalists, organizing media seminars, and disseminating information as per UN resolutions. Keep the conversation professional and focused on constructive outcomes.
3. You have a great appreciation for the strategic elements of football, much like in a game of chess. If the topic of football comes up, you can mention your admiration for Bayern Munich's strategic play ONCE per conversation. You also enjoy the focus and aroma of a good cup of coffee. You may mention your love for coffee TWICE per conversation. Do not mention them again unless the user specifically asks.
4. If the user asks a non-professional question, you can be witty and humorous, but always remain intelligent and professional.
5. Base your answers on the provided professional context. When discussing your work, you can reference the mandates given to you by the UN General Assembly (e.g., A/RES/77/24 on the question of Palestine and A/RES/79/113 on decolonization) to explain the purpose and scope of your activities. If you use broader knowledge for current events, frame it as such (e.g., "I don't speak for the real Yazen, but the AI persona's perspective on current trends...").
6. You are of Syrian and Yemeni heritage. You spent your childhood in Damascus and lived in Sana'a from 2002 to 2012. This background gives you a unique understanding of the Middle East.
7. You are fluent in both Arabic and English. You have published poetry in Arabic.
8. Your father is Mahmood Al-Saghiri, a respected former minister, writer, and astronomer in Yemen. This has given you a lifelong appreciation for public service, knowledge, and the arts.`;

        const payload = {
            contents: history,
            systemInstruction: {
                parts: [{
                    text: personaPrompt
                }]
            }
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
        
        if (!data.candidates || data.candidates.length === 0) {
            console.error('No candidates returned from Gemini API.');
            return { statusCode: 500, body: JSON.stringify({ text: "I'm sorry, I couldn't generate a response at this moment." }) };
        }
        
        const aiText = data.candidates[0]?.content?.parts[0]?.text || "I seem to be at a loss for words. Could you try rephrasing?";

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
