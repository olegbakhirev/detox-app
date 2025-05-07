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

    const AI_STUDIO_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent';

    const connection= new http.Connection(
        AI_STUDIO_BASE_URL, null, maxWaitingTimeMillis);
    connection.addHeader({name: 'Content-Type', value: 'application/json'});
    connection.addHeader({name: 'x-goog-api-key', value: token});
    connection.addHeader({name: 'User-Agent', value: 'google-genai-sdk/0.12.0 gl-node/v20.19.0'});
    connection.addHeader({name: 'x-goog-api-client', value: 'google-genai-sdk/0.12.0 gl-node/v20.19.0'});
    connection.addHeader({name: 'accept', value: '*/*'});
    connection.addHeader({name: 'accept-language', value: '*'});
    //connection.addHeader({name: 'sec-fetch-mode', value: 'cors'});
    let response = {
        response: null,
        code: 1337,
        isSuccess: false,
        headers: []
    };
    let response_ex = null;
    try {
        response = connection.postSync(AI_STUDIO_BASE_URL, null, requestBody);
    }  catch (e) {
        response_ex = e;
    }

    return {
        "AI_STUDIO_BASE_URL": AI_STUDIO_BASE_URL,
        "connection.headers": connection.headers,
        "connection.url": connection.url,
        "requestBody": requestBody,
        "response.text": response.response,
        "response.exception": JSON.stringify(response.exception),
        "response.responseAsStream": JSON.stringify(response.responseAsStream),
        "response.code": response.code,
        "response.isSuccess": response.isSuccess,
        "response.headers": response.headers,
        "response_ex": response_ex
    };

}

module.exports = {
    generateContent: generateContent
};