const systemInstruction = {
    role: 'user',
        parts: [
        {
            "text": "Summarize issue texts from the input field. Provide JSON answer via the output field"
        }
    ]
}

module.exports = {
    systemInstruction: systemInstruction
};