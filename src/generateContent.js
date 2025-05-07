const http = require("@jetbrains/youtrack-scripting-api/http");
const {generationConfig} = require("./generationConfig.js");
const {systemInstruction} = require("./systemInstruction.js");
const {safetySettings} = require("./safetySettings.js");


function generateContent(issueDTO, maxComments, maxWaitingTimeMillis, token) {
    const requestBody = {
        "contents": [
            {
                "role": 'user',
                "parts": [
                    {
                        "text": JSON.stringify({ "input": issueDTO } )
                    }
                ]
            },
        ],
        "generationConfig" : generationConfig,
        "systemInstruction": systemInstruction,
        "safetySettings": safetySettings
    };

    const AI_STUDIO_BASE_URL = 'https://generativelanguage.googleapis.com';
    const connection= new http.Connection(
        AI_STUDIO_BASE_URL, null, maxWaitingTimeMillis);
    connection.addHeader({name: 'Content-Type', value: 'application/json'});
    connection.addHeader({name: 'Accept', value: 'application/json'});
    connection.addHeader({name: 'x-goog-api-key', value: token});
    connection.addHeader({name: 'User-Agent', value: 'google-genai-sdk/0.12.0 gl-node/v20.19.0'});
    connection.addHeader({name: 'x-goog-api-client', value: 'google-genai-sdk/0.12.0 gl-node/v20.19.0'});
    connection.addHeader({name: 'sec-fetch-mode', value: 'cors'});

    let response = connection.postSync('/v1beta/models/gemini-2.0-flash-001:generateContent', {}, requestBody);

    return JSON.parse(response.response);

}

module.exports = {
    generateContent: generateContent
};