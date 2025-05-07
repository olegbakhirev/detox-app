function generationConfig(maxItems) {
    return {
        maxOutputTokens: 2048,
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
                            "minItems": maxItems,
                            "maxItems": maxItems,
                            "items": {
                                "type": "OBJECT",
                                "properties": {
                                    "comment": {
                                        "type": "STRING",
                                        "nullable": true,
                                        "title": 'Additional comment from the Topic Starter',
                                        "description": "comment of Issue, markdown text"
                                    },
                                    "answer": {
                                        "type": "STRING",
                                        "nullable": true,
                                        "title": "Answer for comments, description and summary",
                                        "description": "answer for the issue from commenters"
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
                        "toxicScore_for_TopicStarter": {
                            "type": "INTEGER",
                            "title": "toxicScore for the summary, description and comments",
                            "nullable": true,
                            "description": "Emotional status of the summary, description and comments. This is a value from 0 (Very Positive) to 100 (Very Negative)"
                        },
                        "toxicScore_for_Commenters": {
                            "type": "INTEGER",
                            "title": "toxicScore of answers",
                            "nullable": true,
                            "description": "Emotional status of answers. It is a value from 0 (Very Positive) to 100 (Very Negative)"
                        },
                        "aiSummary": {
                            "type": "STRING",
                            "nullable": false,
                            "description": "Emotional status of the entire issue",
                        },
                        "toxicGrow": {
                            "type": "INTEGER",
                            "nullable": false,
                            "example": "1 | -1 | 0",
                            "description": "If the emotional status grows from the beginning of conversation then '1', when falling then '-1'  if stays same then '0'"
                        }
                    }
                }
            }
        }
    }
};

module.exports = {
    generationConfig: generationConfig
};