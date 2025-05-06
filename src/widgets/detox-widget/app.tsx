import React, {memo, useCallback, useState, useEffect} from 'react';
import Button from '@jetbrains/ring-ui-built/components/button/button';
import Link from '@jetbrains/ring-ui-built/components/link/link';
import Loader from '@jetbrains/ring-ui-built/components/loader/loader';
import SmartTable from '@jetbrains/ring-ui-built/components/table/smart-table';
import {Column} from '@jetbrains/ring-ui-built/components/table/header-cell';
import Selection from '@jetbrains/ring-ui-built/components/table/selection';
import ToxicScore, { Issue, ToxicAnalysisResponse } from './toxic-score';
import PriorityIcon from './priority-icon';
import AverageToxicScore from './average-toxic-score';
import IssuesList from './issues-list';
import SearchInput from './search-input';

// Register widget in YouTrack. To learn more, see https://www.jetbrains.com/help/youtrack/devportal-apps/apps-host-api.html
const host = await YTApp.register();


const AppComponent: React.FunctionComponent = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('Assignee: me');

  // Define table columns
  const columns: Column<Issue>[] = [
    {
      id: 'toxicScore',
      title: 'Toxic score',
      sortable: true,
      getValue: (item: Issue) => {
        return <ToxicScore issue={item}/>;
      }
    },
    {
      id: 'id',
      title: 'ID',
      sortable: true,
      className: 'id-column',
      getValue: (item: Issue) => {
        // Extract priority from bundled fields
        let priorityFromFields = null;

        if (item.fields) {
          const bundleFields = (item.fields || []).filter(
            (issueField: {
              projectCustomField: {
                field?: {
                  name?: string;
                };
                bundle?: any;
              };
              value?: any;
            }) => !!issueField.projectCustomField.bundle
          );

          const priorityField = bundleFields.filter(
            (issueField: {
              projectCustomField: {
                field?: {
                  name?: string;
                };
                bundle?: any;
              };
              value?: any;
            }) => {
              const field = issueField.projectCustomField.field || {};
              return (field.name || '').toLowerCase() === 'priority';
            }
          )[0];

          if (priorityField && priorityField.value) {
            priorityFromFields = {
              id: priorityField.value.id || '',
              name: priorityField.value.name || '',
              color: priorityField.value.color || ''
            };
          }
        }

        // Use priority from fields if available, otherwise use the provided priority
        const finalPriority = priorityFromFields || item.priority;

        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span
              className={`priority-icon priority-${finalPriority.name.toLowerCase()}`}
              style={{
                marginRight: '4px',
                borderRadius: '0',
                ...(finalPriority.color ? { backgroundColor: finalPriority.color } : {})
              }}
            />
            <Link href={`/issue/${item.id}`}>{item.id}</Link>
          </div>
        );
      }
    },
    {
      id: 'summary',
      title: 'Summary',
      sortable: true
    },
    {
      id: 'status',
      title: 'Status',
      sortable: true
    },
    {
      id: 'priority',
      title: 'Priority',
      sortable: true,
      getValue: (item: Issue) => <PriorityIcon priority={item.priority} issue={item}/>
    },
    {
      id: 'assignee',
      title: 'Assignee',
      sortable: true
    },
    {
      id: 'updated',
      title: 'Updated',
      sortable: true
    }
  ];

  // Handler for query changes from SearchInput
  const handleQueryChange = useCallback(async (query: string) => {
    const result = await host.fetchApp('backend/detox-settings', {method: 'POST', body: {query}});
    console.log('Saved query:', result);
    setSearchQuery(query);
  }, []);

  // Function to fetch issues directly from YouTrack API
  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching issues:');

      // Fetch issues directly from YouTrack API
      const fields = 'id,idReadable,summary,resolved,priority(id,name,color),created,updated,fields(projectCustomField(field(name),bundle),value(name,color,id))';
      let url = `issues?fields=${encodeURIComponent(fields)}`;

      // Add search query if provided
      if (searchQuery) {
        url += `&query=${encodeURIComponent(searchQuery)}`;
      }

      console.log('Fetching issues from YouTrack API:', url);

      // Make the request to YouTrack API
      const data = await host.fetchYouTrack(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      console.log('YouTrack API response:', data);

      // Map the YouTrack API response to our expected format
      const issues = Array.isArray(data) ? data.map(issue => ({
        id: issue.idReadable || issue.id, // Use idReadable if available, otherwise fall back to id
        summary: issue.summary,
        status: issue.resolved ? 'Resolved' : 'Open',
        priority: issue.priority ? {
          id: issue.priority.id,
          name: issue.priority.name,
          color: issue.priority.color
        } : {
          id: 'normal',
          name: 'Normal',
          color: '#59a869' // Default color for Normal priority
        },
        assignee: (() => {
          // Extract assignee from bundled fields
          if (issue.fields) {
            const bundleFields = (issue.fields || []).filter(
              (issueField: {
                projectCustomField: {
                  field?: {
                    name?: string;
                  };
                  bundle?: any;
                };
                value?: any;
              }) => !!issueField.projectCustomField.bundle
            );

            const assigneeField = bundleFields.filter(
              (issueField: {
                projectCustomField: {
                  field?: {
                    name?: string;
                  };
                  bundle?: any;
                };
                value?: any;
              }) => {
                const field = issueField.projectCustomField.field || {};
                return (field.name || '') === 'Assignee';
              }
            )[0];

            if (assigneeField && assigneeField.value) {
              return assigneeField.value.name || 'Unassigned';
            }
          }
          return 'Unassigned';
        })(),
        created: new Date(issue.created).toISOString().split('T')[0],
        updated: new Date(issue.updated).toISOString().split('T')[0],
        fields: issue.fields
      })) : [];

      setIssues(issues);
      console.log('Issues state after setting:', issues);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching issues from YouTrack API:', err);
      setIssues([]);
      setError('Failed to load issues from YouTrack API. Using mock data.');
      setLoading(false);
    }
  }, [searchQuery]);

  // Fetch issues on component mount and when fetchIssues changes
  useEffect(() => {
    host.fetchApp<{query?: string}>('backend/detox-setting', {}).
    then(persisted => {
      setSearchQuery(persisted.query ?? '');
      console.log('Persisted query:', persisted.query);
    });

    fetchIssues();
  }, [fetchIssues]);

  // Function to handle item click
  const handleItemClick = (item: Issue, e: React.MouseEvent<HTMLTableRowElement>) => {
    // In a real application, you would navigate to the issue details page
    console.log('Clicked on issue:', item);
  };

  // Function to handle selection change
  const handleSelectionChange = (selection: Selection<Issue>) => {
    console.log('Selection changed:', selection);
  };

  // Function to refresh issues
  const handleRefresh = () => {
    fetchIssues();
  };

  // Function to test the analyze-toxic endpoint
  const testAnalyzeToxic = async (description: string) => {
    try {
      console.log('Testing analyze-toxic endpoint with description:', description);
      const result = await host.fetchApp('backend/analyze-toxic', {
        method: 'POST',
        body: JSON.stringify({ description }),
        headers: {
          'Content-Type': 'application/json'
        }
      }) as ToxicAnalysisResponse;
      console.log('Analyze toxic result:', result);
      return result.toxicScore;
    } catch (err) {
      console.error('Error testing analyze-toxic endpoint:', err);
      return null;
    }
  };

  return (
    <div className="widget">
      <div className="widget-header">
        <h3>Detox App</h3>
        <div className="widget-buttons">
          <Button primary onClick={handleRefresh}>Refresh</Button>
          <Button onClick={() => testAnalyzeToxic("This is a test issue description that should be analyzed for toxic.")}>
            Test Toxic Analysis
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="loader-container">
          <Loader message="Loading issues..."/>
        </div>
      ) : error ? (
        <div className="error-message">
          {error}
          <Button onClick={handleRefresh}>Try Again</Button>
        </div>
      ) : (
        <div className="content-container">
          <div className="search-container">
            <SearchInput
              initialQuery={searchQuery}
              onQueryChange={handleQueryChange}
              host={host}
            />
          </div>
          <div className="content-row">
            <IssuesList
              issues={issues}
              columns={columns}
              onItemClick={handleItemClick}
              onSelectionChange={handleSelectionChange}
            />
            {issues.length > 0 && (
              <AverageToxicScore issues={issues}/>
            )}
          </div>
        </div>
      )}

      <div className="widget-footer">
        <Link href="https://github.com/JetBrains/youtrack-issues-list-widget" target="_blank">
          View Source on GitHub
        </Link>
      </div>
    </div>
  );
};

export const App = memo(AppComponent);
