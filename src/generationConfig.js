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
                                    "text": {
                                        "type": "STRING",
                                        "nullable": false,
                                        "description": "comment of Issue, markdown text"
                                    },
                                    "isTopicStarter": {
                                        "type": "BOOLEAN",
                                        "nullable": false,
                                        "description": "The author of texts summary and description is an author of the current comment"
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
                            "title": "toxicScore for the TopicStarter only",
                            "nullable": false,
                            "description": "Emotional status of the summary, the description and comments where isTopicStarter == true. This is a value from 0 (Very Positive) to 100 (Very Negative)"
                        },
                        "toxicScore_for_Commenters": {
                            "type": "INTEGER",
                            "title": "toxicScore for Commenters only",
                            "nullable": false,
                            "description": "Emotional status of comments where isTopicStarter == false or an empty string for issues without any comments with the property isTopicStarter == false. It is a value from 0 (Very Positive) to 100 (Very Negative)"
                        },
                        "aiSummary": {
                            "type": "STRING",
                            "nullable": false,
                            "description": "Emotional status of the issue and all comments of the issue"
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