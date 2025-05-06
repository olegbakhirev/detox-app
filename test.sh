cat << EOF > request.json
{
    "contents": [
        {
            "role": "user",
            "parts": [
                {
                    "text": "request_schema = {\n    \"type\": \"OBJECT\",\n    \"properties\": {\n        \"IssueType\": {\"type\": \"STRING\", \"nullable\": false, \"description\": \"Issue Type\", \"examples\": \"Task | Bug | Feature\",\n            \"is_Markdown_String\": false\n        },\n        \"Title\": {\"type\": \"STRING\", \"nullable\": true, \"description\": \"Title of Issue\",\n            \"is_Markdown_String\": false },\n        \"Description\": {\"type\": \"STRING\", \"nullable\": true, \"description\": \"Description of Issue\",\n            \"is_Markdown_String\": true },\n        \"comments\": {\n            \"type\": \"ARRAY\",\n            \"items\": {\n                \"type\": \"OBJECT\",\n                \"properties\": {\n                    \"Date\": {\"type\": \"STRING\", \"nullable\": true,\n                        \"is_Markdown_String\": false, \"description\": \"The date of the comment\"},\n                    \"UserID\": {\"type\": \"INTEGER\", \"nullable\": true, \"description\": \"Uniq user's ID. It is a uniq for this issue\"},\n                    \"Comment\": {\"type\": \"STRING\", \"nullable\": true, \"description\": \"Comment about the issue\",\n                        \"is_Markdown_String\": true}\n                },\n                \"required\": [\"Date\", \"UserID\", \"Comment\"]\n            }\n        },\n        \"required\": [\"IssueType\", \"Title\"]\n    }\n}\n\nresponse_schema = {\n    \"type\": \"OBJECT\",\n    \"properties\": { \n         \"value\": {\"type\": \"INTEGER\", \"nullable\": false, \n            \"description\": \"Emotional status of the issue from 0 (Very Negative) to 100 (Very Positive)\", examples: \"23\"},\n        \"text\" : {\n            \"type\": \"STRING\", \"nullable\": false, \"description\": \"Emotional status of the issue and all comments of the issue\",\n            \"is_Markdown_String\": false, \"examples\": \"POSITIVE | NEGATIVE\"} \n        }\n}\n                        \nRequests can use variables for the multiline texts. Variables use the boundary line for splitting.\n\nBOUNDARY_LINE = \"=============98326481263486128346918276348912638471623846==============\"\n\nFollow the response_schema\n\n\nVARIABLES\n\n\n=============98326481263486128346918276348912638471623846==============\nHello! I have a big problem with the system. How can I solve it? \nI **can not type** my login and password.\n=============98326481263486128346918276348912638471623846==============\n\n\n=============98326481263486128346918276348912638471623846==============\nHello! Yes, the application doesn't work well. Try to reload the page\n=============98326481263486128346918276348912638471623846==============\n\n\n=============98326481263486128346918276348912638471623846==============\nThank you very much! I love you!\n=============98326481263486128346918276348912638471623846==============\n\nPROMPT\n\nDO: Summarize the text.  \n\nrequest = {\n    \"IssueType\": \"Task\",\n    \"Title\": \"Task 1\",\n    \"Description\": \"\",\n    \"comments\": [\n        {\n        \"Date\": \"2023-01-01\",\n        \"UserID\": 1,\n        \"Comment\": \"\"\n        },\n        {\n        \"Date\": \"2023-01-02\",\n        \"UserID\": 2,\n        \"Comment\": \"\"\n        }\n    ]\n}"
                }
            ]
        }
    ]
    , "generationConfig": {
        "responseModalities": ["TEXT"]
        ,"temperature": 1
        ,"maxOutputTokens": 8192
        ,"topP": 0.95
    },
    "safetySettings": [
        {
            "category": "HARM_CATEGORY_HATE_SPEECH",
            "threshold": "OFF"
        },
        {
            "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
            "threshold": "OFF"
        },
        {
            "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            "threshold": "OFF"
        },
        {
            "category": "HARM_CATEGORY_HARASSMENT",
            "threshold": "OFF"
        }
    ]
}
EOF

PROJECT_ID="aihktn25-33"
LOCATION_ID="us-central1"
API_ENDPOINT="us-central1-aiplatform.googleapis.com"
MODEL_ID="gemini-2.0-flash-001"
GENERATE_CONTENT_API="streamGenerateContent"

curl \
-X POST \
-H "Content-Type: application/json" \
-H "Authorization: Bearer ya29.a0AZYkNZgGAS5Bzts6jfwp3gn5XYqGwUhlUrthxfnyYqrvJomAjN_kNS-IzJYKtxnjvKs9bqYVN5IChgB7wEeBrhC2UEYlnBXCojwDIlhPOWVqpWW18ni7xPpWpcrl9VVcXsfKli64_cZzKrhq3AMy7a5CzVwJ5q4xlID_8obKj9HS7bsFQ5YX3M2_2z_3VpyW1r1dE-VXYdxhbxaVASHeMKEPc9jNPhJXKvtp_DtxkpQVHAO1DZSTZWD3mHxGiOqmEyH9BoJUfY6cEF9Ncoc_B1hR_L5iuppx2kr2jebqhfUvRQ8k32CClq7U7GLHwTvVfguqrHBzsbhOMq90pPgXF3MpipGIKOH_2lfMt1ZzZX4OY9P7pK-mNy1FUVDrSBbbnhAWTUoggZCoaQsslSjH1brYcK7RIZvgACzTaCgYKAdsSARUSFQHGX2MiQgZ8uGPzMr7UXvIwCc0TBg0427" \
"https://${API_ENDPOINT}/v1/projects/${PROJECT_ID}/locations/${LOCATION_ID}/publishers/google/models/${MODEL_ID}:${GENERATE_CONTENT_API}" -d '@request.json'