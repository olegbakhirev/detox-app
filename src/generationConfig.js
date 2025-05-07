const generationConfig = {
    maxOutputTokens: 100,
    temperature: 0.1,
    topP: 0.01,
    responseMimeType: "application/json",
    candidateCount: 1,
    responseSchema: {
        type: 'OBJECT',
        title: 'input or output objects',
        description: 'Issue or Emotional estimation of the issue',
        nullable: false,
        properties: {
            "input": {
                "type": 'OBJECT',
                "title": 'input object',
                "description": 'Issue',
                "nullable": true,
                "properties": {
                    "summary": {
                        "type": "STRING",
                        "nullable": false,
                        "description": "title of issue",
                    },
                    "description": {
                        "type": "STRING",
                        "nullable": true,
                        "description": "description of Issue, markdown text",
                    },
                    "comments": {
                        "type": "ARRAY",
                        "nullable": true,
                        "minItems": 0,
                        "maxItems": 20,
                        "items": {
                            "type": "OBJECT",
                            "properties": {
                                "text": {
                                    "type": "STRING",
                                    "nullable": false,
                                    "description": "comment of Issue, markdown text"
                                }
                            },
                        }
                    },
                }
            },
            output: {
                "type": 'OBJECT',
                "title": 'output object',
                "description": 'Emotional status of the issue content',
                "nullable": true,
                "properties": {
                    "toxicScore": {
                        "type": "INTEGER",
                        "nullable": false,
                        "description": "Emotional status of the issue from 0 (Very Positive) to 100 (Very Negative)"
                    },
                    "aiSummary": {
                        "type": "STRING",
                        "nullable": false,
                        "description": "Emotional status of the issue and all comments of the issue"
                    }
                }
            }
        }
    }
};

module.exports = {
    generationConfig: generationConfig
};