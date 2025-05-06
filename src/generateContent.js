const http = require("@jetbrains/youtrack-scripting-api/http");

function getEmptyRequestBody(maxComment){
    return {
        contents: [
            {
                role: 'user',
                parts: {
                    "text": ""
                }
            },
        ],
        generationConfig: {
            responseMimeType: 'application/json',
            maxOutputTokens: 100,
            temperature: 1,
            topP: 0.95,
            responseModalities: ["TEXT"],
            safetySettings: [
                {
                    category: 'HARM_CATEGORY_HATE_SPEECH',
                    threshold: 'OFF',
                },
                {
                    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                    threshold: 'OFF',
                },
                {
                    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                    threshold: 'OFF',
                },
                {
                    category: 'HARM_CATEGORY_HARASSMENT',
                    threshold: 'OFF',
                }
            ],
            candidateCount: 1,
            responseSchema: {
                input: {
                    type: 'OBJECT',
                    title: 'input object',
                    description: 'Issue',
                    nullable: true,
                    properties: {
                        summary: {
                            "type": "STRING",
                            "nullable": false,
                            "format": "plain text",
                            "description": "title of issue",
                        },
                        "description": {
                            "type": "STRING",
                            "nullable": true,
                            "description": "description of Issue",
                            "format": "markdown text",
                        },
                        "comments": {
                            "type": "ARRAY",
                            "nullable": true,
                            "minItems": 0,
                            "maxItems": maxComment,
                            "items": {
                                "type": "OBJECT",
                                "properties": {
                                    "text": {
                                        "type": "STRING",
                                        "nullable": false,
                                        "description": "comment of Issue",
                                        "format": "markdown text",
                                    }
                                },
                            }
                        },
                    }
                },
                output: {
                    type: 'OBJECT',
                    title: 'output object',
                    description: 'Emotional status of the issue content',
                    nullable: true,
                    properties: {
                        "value": {
                            "type": "INTEGER",
                            "nullable": false,
                            "description": "Emotional status of the issue from 0 (Very Negative) to 100 (Very Positive)",
                            examples: "23"
                        },
                        "text": {
                            "type": "STRING",
                            "nullable": false,
                            "format": "plain text",
                            "description": "Emotional status of the issue and all comments of the issue",
                            "examples": "POSITIVE | NEGATIVE"
                        }
                    }
                }
            }
        },
        systemInstruction: {
            role: 'user',
            parts: {
                "text": "Summarize issue texts from the input field. Provide JSON answer via the output field"
            }
        }
    }
}


function generateContent(issueDTO, maxComments, maxWaitingTimeMillis, token) {
    let requestBody = null;
    let requestBody_ex = null;
    try {
        requestBody = getEmptyRequestBody(maxComments);
    } catch (e) {
        requestBody_ex = e.message;
    }
    let requestBody_content_ex = null;
    try {
        requestBody.contents[0].parts[0].text = JSON.stringify(issueDTO);
    }  catch (e) {
        requestBody_content_ex =  e.message;
    }

    const AI_STUDIO_BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:GenerateContent`;

    let connection = null;
    let connection_ex = null;
    try {
        connection = new http.Connection(AI_STUDIO_BASE_URL, null, maxWaitingTimeMillis);
        connection.addHeader({name: 'Content-Type', value: 'application/json'});
        connection.addHeader({name: 'x-goog-api-key', value: `${token}`});
    } catch (e) {
        connection_ex = e.message;
    }
    let response = null;
    let response_ex = null;
    try {
        response = connection.postSync(AI_STUDIO_BASE_URL, null, requestBody).json();
    }  catch (e) {
        response_ex = e.message;
    }

    return {
        "AI_STUDIO_BASE_URL": AI_STUDIO_BASE_URL,
        //"requestBody": requestBody,
        "requestBody_ex": requestBody_ex,
        "requestBody_content_ex": requestBody_content_ex,
        "connection": connection,
        "connection_ex": connection_ex,
        "response": response,
        "response_ex": response_ex,
    };
    //
    // if (response && response.isSuccess) {
    //     // GenerateContentResponse
    //     // https://cloud.google.com/vertex-ai/docs/reference/rest/v1/GenerateContentResponse
    //     return JSON.parse(response.response);
    // } else {
    //     return {
    //         "requestBody": requestBody,
    //         "requestBody_ex": requestBody_ex,
    //         "requestBody_content_ex": requestBody_content_ex,
    //         "connection": connection,
    //         "connection_ex": connection_ex,
    //         "response": response,
    //         "response_ex": response_ex,
    //     };
    // }

}

module.exports = {
    generateContent: generateContent
};