
exports.httpHandler = {
  endpoints: [
    {
      method: 'GET',
      path: 'gemini-token',
      handle: async function handle(ctx) {
        try {
          // Read the settings.json file
          const fs = require('fs');
          const path = require('path');
          const settingsPath = path.resolve(__dirname, '../settings.json');

          // Check if the file exists
          if (!fs.existsSync(settingsPath)) {
            ctx.response.status(404).json({ error: 'Settings file not found' });
            return;
          }

          // Read and parse the settings file
          const settingsContent = fs.readFileSync(settingsPath, 'utf8');
          const settings = JSON.parse(settingsContent);

          // Check if geminiToken exists in settings
          if (!settings.geminiToken) {
            ctx.response.status(404).json({ error: 'Gemini token not found in settings' });
            return;
          }

          // Return the token
          ctx.response.json({ geminiToken: settings.geminiToken });
        } catch (error) {
          console.error('Error getting Gemini token:', error);
          ctx.response.status(500).json({ error: 'Internal server error' });
        }
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
          const prompt = `Analyze the following text and rate its level of toxic or toxicity on a scale from 0 to 100, where 0 is completely neutral and 100 is extremely hateful or toxic. Only respond with a number between 0 and 100, with one decimal place precision.

          Issue description: "${issueDescription}"`;

          // Read the Gemini API key from settings.json
          const fs = require('fs');
          const path = require('path');
          const settingsPath = path.resolve(__dirname, '../settings.json');

          let GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY';

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
            ctx.response.json({ toxicScore: 0.0 });
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
              ctx.response.json({ toxicScore: 0.0 });
              return;
            }

            // Parse the response data
            data = await response.json();
          } catch (error) {
            console.error('Error calling Gemini API:', error);
            // Fall back to default toxic score
            console.warn('Falling back to default toxic score of 0.0.');
            ctx.response.json({ toxicScore: 0.0 });
            return;
          }

          // Extract the toxic score from the response
          let toxicScore = 5.0; // Default score if parsing fails

          if (data.candidates && data.candidates[0] && data.candidates[0].content &&
              data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
            const responseText = data.candidates[0].content.parts[0].text;
            // Try to parse the response as a number
            const parsedScore = parseFloat(responseText.trim());
            if (!isNaN(parsedScore) && parsedScore >= 0 && parsedScore <= 10) {
              toxicScore = Math.round(parsedScore * 10) / 10; // Round to 1 decimal place
            }
          }

          // Return the toxic score
          ctx.response.json({ toxicScore });
        } catch (error) {
          console.error('Error analyzing toxic:', error);
          ctx.response.status(500).json({ error: 'Internal server error' });
        }
      }
    },
  ]
};
