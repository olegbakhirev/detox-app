const entities = require('@jetbrains/youtrack-scripting-api/entities');
const {generateContent} = require("./generateContent.js");
//const generateContent = require('./generateContent.js');

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
        const maxComments = 25;
        let commentsLimit = maxComments;
        const maxVaitingTimeMillis = 120000;

          let issueId = ctx.request.json().issueId;

          // https://www.jetbrains.com/help/youtrack/devportal/v1-Issue.html
          // https://www.jetbrains.com/help/youtrack/devportal/v1-Issue.html#properties
          let issue = entities.Issue.findById(issueId);

          const issueDTO = {
              "summary": issue.summary,
              "description": issue.description,
              comments: [],
          };
          // Set.<IssueComment>
          // https://www.jetbrains.com/help/youtrack/devportal/v1-IssueComment.html
          // author : User.ringId
          // deleted | becomesRemoved
          // text
        let commentCount = 0;
          issue.comments.forEach(comment => {
            if (!comment.deleted && commentsLimit > 0) {
              issueDTO.comments.push({
                "text": comment.text,
                "isTopicStarter": comment.author.login === issue.reporter.login,
              });
              commentsLimit--;
              commentCount++;
            }
          });

        let result = generateContent(issueDTO, commentCount, maxVaitingTimeMillis, ctx.settings.api_token);
        if(result.code === 200) {
          ctx.response.json(result.output);
        } else {
          ctx.response.code = result.code;
          ctx.response.text(result.error);
        }
      }
    },
  ]
};
