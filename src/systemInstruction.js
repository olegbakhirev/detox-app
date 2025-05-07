const systemInstruction = {
    role: 'user',
        parts: [
        {
            "text": "Summarize issue texts from the input field. Be brief, use 10-20 words only. Provide JSON answer via the output field"
        }
    ]
}

module.exports = {
    systemInstruction: systemInstruction
};