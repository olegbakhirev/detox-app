const systemInstruction = {
    role: 'user',
        parts: [
        {
            "text": "Summarize issue texts from the input field. Analyze if toxicity is growing. Provide JSON answer via the output field. Be brief, use 10-20 words only for each property of the output field."
        }
    ]
}

module.exports = {
    systemInstruction: systemInstruction
};