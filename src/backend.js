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
        const maxComments = 2;
        let commentsLimit = maxComments;
        const maxVaitingTimeMillis = 10000;

          let issueId = null;
          let issueId_exception = null;
          try {
            issueId = ctx.request.json().issueId;
          } catch (e) {
            issueId_exception  = e.message;
          }
          // https://www.jetbrains.com/help/youtrack/devportal/v1-Issue.html
          // https://www.jetbrains.com/help/youtrack/devportal/v1-Issue.html#properties
          let issue = null;
          let issue_exception = null;
          try {
            issue = entities.Issue.findById(issueId);
          } catch (e) {
            issue = null;
            issue_exception = e.message;
          }
          let issueDTO = null;
          let issueDTO_exception_1 = null;

          try {
            issueDTO = {
              "summary": issue.summary,
              "description": issue.description,
              comments: new Set()
            };
          }  catch (e) {
            issueDTO = null;
            issueDTO_exception_1 = e.message;
          }
          // Set.<IssueComment>
          // https://www.jetbrains.com/help/youtrack/devportal/v1-IssueComment.html
          // author : User.ringId
          // deleted | becomesRemoved
          // text
          let issueDTO_exception_2 = null;

          try {
            issue.comments.forEach(comment => {
              if (!comment.deleted && commentsLimit > 0) {
                issueDTO.comments.add({
                  "text": comment.text,
                });
                commentsLimit--;
              }
            });
          }  catch (e) {
            issueDTO_exception_2 =  e.message;
          }
          let result = null;
          let result_exception = null;
          try {
            result = generateContent(issueDTO, maxComments, maxVaitingTimeMillis, ctx.settings.api_token);
          }  catch (e) {
            result_exception  = e.message;
          }

          ctx.response.json({
            "issueId": issueId,
            "issueId_exception": issueId_exception,
            "issue": issue,
            "issue_exception": issue_exception,
            "issueDTO": issueDTO,
            "issueDTO_exception_1": issueDTO_exception_1,
            "issueDTO_exception_2": issueDTO_exception_2,
            "result": result,
            "result_exception": result_exception
          });
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
