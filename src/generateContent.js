const http = require("@jetbrains/youtrack-scripting-api/http");
const AI_STUDIO_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:streamGenerateContent";

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
        //cachedContent: "",
        tools: [],
        toolConfig: [],
        generationConfig: {
            responseMimeType: 'application/json',
            maxOutputTokens: 30,
            temperature: 1,
            topP: 0.95,
            candidateCount: 1,
            responseLogprobs: false,
            seed: 1337,
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
    const requestBody = getEmptyRequestBody(maxComments);
    requestBody.contents[0].parts.text = JSON.stringify(issueDTO);

    const connection = new http.Connection(AI_STUDIO_BASE_URL, null, maxWaitingTimeMillis);
    connection.addHeader({name: 'Content-Type', value: 'application/json'});
    connection.bearerAuth(token);
    const response = connection.postSync(AI_STUDIO_BASE_URL, null, requestBody);
    if (response && response.isSuccess) {
        // GenerateContentResponse
        // https://cloud.google.com/vertex-ai/docs/reference/rest/v1/GenerateContentResponse
        return JSON.parse(response.response);
    } else {
        return response;
    }

}

module.exports = {
    generateContent: generateContent
};