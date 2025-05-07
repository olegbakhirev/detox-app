
exports.httpHandler = {
  endpoints: [
    {
      method: 'POST',
      path: 'detox-settings',
      handle: function handle(ctx) {
        const {name} = ctx.settings;
        const body = ctx.request.json();
        ctx.globalStorage.extensionProperties.detoxWidgetQuery = body.query;
        // eslint-disable-next-line no-console
        console.log('Updated storage', body);
        ctx.response.json({name, scope: 'global', method: 'POST', receiveBody: body});
      }
    },
    {
      method: 'GET',
      path: 'detox-settings',
      handle: function handle(ctx) {
        console.log('Load: detoxWidgetQuery');
        const {detoxWidgetQuery} = ctx.globalStorage.extensionProperties;
        const {name} = ctx.settings;
        console.log('Loaded: detoxWidgetQuery', detoxWidgetQuery);
        ctx.response.json({
          scope: 'global',
          name,
          query: detoxWidgetQuery,
        });
      }
    },
      {
      method: 'POST',
      path: 'analyze-toxic',
      handle: async function handle(ctx) {
        try {
          // Get the issue description from the request body
          const requestBody = ctx.request.body;
          const issueDescription = requestBody.description;

          if (!issueDescription) {
            ctx.response.status(400).json({ error: 'Issue description is required' });
            return;
          }

          // Prepare the prompt for Gemini API
          const prompt = `Analyze the following text and provide two things:
          1. Rate its level of toxic or toxicity on a scale from 0 to 100, where 0 is completely neutral and 100 is extremely hateful or toxic. Respond with a number between 0 and 100, with one decimal place precision.
          2. Provide a brief summary (2-3 sentences) of the text, highlighting any potentially toxic or problematic content.

          Format your response as follows:
          Score: [number]
          Summary: [your summary]

          Issue description: "${issueDescription}"`;


          let GEMINI_API_KEY =  ctx.settings.api_token;

          // Try to read the token from settings.json
          if (fs.existsSync(settingsPath)) {
            try {
              const settingsContent = fs.readFileSync(settingsPath, 'utf8');
              const settings = JSON.parse(settingsContent);
              if (settings.geminiToken) {
                GEMINI_API_KEY = settings.geminiToken;
              }
            } catch (error) {
              console.error('Error reading settings file:', error);
            }
          }

          const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

          // Prepare the request to Gemini API
          const geminiRequestBody = {
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ]
          };

          let data;

          // Check if API key is set
          if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
            console.warn('Gemini API key not set. Using default toxic score of 0.0.');
            ctx.response.json({
              toxicScore: 0.0,
              aiSummary: 'No summary available. API key not set.'
            });
            return;
          }

          try {
            // Make the request to Gemini API
            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(geminiRequestBody)
            });

            if (!response.ok) {
              const errorData = await response.json();
              console.error('Gemini API error:', errorData);
              // Fall back to default toxic score
              console.warn('Falling back to default toxic score of 0.0.');
              ctx.response.json({
                toxicScore: 0.0,
                aiSummary: 'No summary available. API error occurred.'
              });
              return;
            }

            // Parse the response data
            data = await response.json();
          } catch (error) {
            console.error('Error calling Gemini API:', error);
            // Fall back to default toxic score
            console.warn('Falling back to default toxic score of 0.0.');
            ctx.response.json({
              toxicScore: 0.0,
              aiSummary: 'No summary available. Error calling API.'
            });
            return;
          }

          // Extract the toxic score and AI summary from the response
          let toxicScore = 5.0; // Default score if parsing fails
          let aiSummary = ''; // Default empty summary

          if (data.candidates && data.candidates[0] && data.candidates[0].content &&
              data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
            const responseText = data.candidates[0].content.parts[0].text;

            // Try to extract score and summary from the formatted response
            const scoreMatch = responseText.match(/Score:\s*(\d+\.?\d*)/i);
            const summaryMatch = responseText.match(/Summary:\s*([\s\S]+)$/i);

            if (scoreMatch && scoreMatch[1]) {
              const parsedScore = parseFloat(scoreMatch[1]);
              if (!isNaN(parsedScore) && parsedScore >= 0 && parsedScore <= 100) {
                // Convert from 0-100 scale to 0-10 scale
                toxicScore = Math.round((parsedScore / 10) * 10) / 10; // Round to 1 decimal place
              }
            } else {
              // Fallback: try to parse the entire response as a number (for backward compatibility)
              const parsedScore = parseFloat(responseText.trim());
              if (!isNaN(parsedScore) && parsedScore >= 0 && parsedScore <= 10) {
                toxicScore = Math.round(parsedScore * 10) / 10; // Round to 1 decimal place
              }
            }

            if (summaryMatch && summaryMatch[1]) {
              aiSummary = summaryMatch[1].trim();
            }
          }

          // Return the toxic score and AI summary
          ctx.response.json({ toxicScore, aiSummary });
        } catch (error) {
          console.error('Error analyzing toxic:', error);
          ctx.response.status(500).json({ error: 'Internal server error' });
        }
      }
    },
    {
      method: 'GET',
      path: 'dialog-props',
      handle: function handle(ctx) {
        // Get the issue ID from the query parameters
        console.log('Load: dialog-props', ctx.request.query);
        const issueId = "aaaaa"//ctx.request.query.issueId;

        // Return dialog props based on the issue ID
        ctx.response.json({
          title: `Details for Issue ${issueId || 'Unknown'}`,
          content: `This is additional information for the selected issue ${issueId || 'Unknown'}.

Here you can display any relevant details about the issue that you want to show in the popup dialog.
- Priority: High
- Status: Open
- Created: 2023-01-01
- Updated: 2023-06-15
          `
        });
      }
    },
  ]
};
