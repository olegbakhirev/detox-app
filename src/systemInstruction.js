const systemInstruction = {
    role: 'user',
        parts: [
        {
            "text": "Summarize issue texts from the input field. Analyze if toxicity is growing. Provide JSON answer via the output field. Be brief and fast, use 10-20 words only."
        }
    ]
}

module.exports = {
    systemInstruction: systemInstruction
};