import React, {memo, useCallback, useState, useEffect, useRef} from 'react';
import Button from '@jetbrains/ring-ui-built/components/button/button';
import Link from '@jetbrains/ring-ui-built/components/link/link';
import Loader from '@jetbrains/ring-ui-built/components/loader/loader';
import SmartTable from '@jetbrains/ring-ui-built/components/table/smart-table';
import {Column} from '@jetbrains/ring-ui-built/components/table/header-cell';
import ToxicScore, { Issue, ToxicAnalysisResponse } from './toxic-score';
import PriorityIcon from './priority-icon';
import AverageToxicScore from './average-toxic-score';
import IssuesList from './issues-list';
import SearchInput from './search-input';
import PopupCard from './popup-card';


// Register widget in YouTrack. To learn more, see https://www.jetbrains.com/help/youtrack/devportal-apps/apps-host-api.html
const host = await YTApp.register();


const AppComponent: React.FunctionComponent = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('Assignee: me');
  const initialLoadRef = React.useRef<boolean>(false);

  // Popup state
  const [popupVisible, setPopupVisible] = useState<boolean>(false);
  const [popupTitle, setPopupTitle] = useState<string>('');
  const [popupContent, setPopupContent] = useState<string>('');
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // Define table columns
  const columns: Column<Issue>[] = [
    {
      id: 'toxicScore',
      title: 'Toxic score',
      sortable: true,
      getValue: (item: Issue) => {
        return <ToxicScore issue={item} host={host}/>;
      }
    },
    {
      id: 'id',
      title: 'ID',
      sortable: true,
      className: 'id-column',
      getValue: (item: Issue) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
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

  // Function to fetch persisted query from backend
  const fetchPersistedQuery = async () => {
    try {
      const persisted = await host.fetchApp<{query?: string}>('backend/detox-settings', {});
      setSearchQuery(persisted.query ?? '');
      console.log('Persisted query:', persisted.query);
      return persisted.query ?? '';
    } catch (err) {
      console.error('Error fetching persisted query:', err);
      return '';
    }
  };

  // Fetch persisted query on component mount and fetch issues when searchQuery changes
  useEffect(() => {
    const loadIssues = async () => {
      if (!initialLoadRef.current) {
        // Initial load - fetch persisted query first, then fetch issues
        await fetchPersistedQuery();
        initialLoadRef.current = true;
      }
      // Fetch issues (both for initial and subsequent loads)
      fetchIssues();
    };

    loadIssues();
  }, [fetchIssues]);

  // Function to handle item click
  const handleItemClick = async (item: Issue, e: React.MouseEvent<HTMLTableRowElement>) => {
    console.log('Clicked on issue:', item);

    try {
      // Position the popup in the center of the viewport
      const position = {
        top: window.innerHeight / 2 - 200,
        left: window.innerWidth / 2 - 200
      };

      // Fetch dialog props from the backend
      const dialogProps = await host.fetchApp<{ title: string; content: string }>('backend/dialog-props', {query: {issueId: item.id}});

      // Update popup state
      setPopupTitle(dialogProps.title);
      setPopupContent(dialogProps.content);
      setPopupPosition(position);
      setPopupVisible(true);
    } catch (err) {
      console.error('Error fetching dialog props:', err);
    }
  };

  // Function to close the popup
  const closePopup = () => {
    setPopupVisible(false);
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
      // Return the full result object with both toxicScore and aiSummary
      return {
        toxicScore: result.toxicScore,
        aiSummary: result.aiSummary
      };
    } catch (err) {
      console.error('Error testing analyze-toxic endpoint:', err);
      return null;
    }
  };

  return (
    <div className="widget">
      <div className="widget-header">
        <h3 style={{ display: 'flex', alignItems: 'center' }}>
          <svg width="32px" height="32px" viewBox="0 0 1024 1024" style={{ marginRight: '8px' }}>
            <g transform="translate(0.000000,1024.000000) scale(0.100000,-0.100000)" fill="#32CD32" stroke="none">
              <path d="M4580 9056 c-740 -165 -1378 -653 -1725 -1319 -245 -470 -337 -978 -269 -1497 8 -63 17 -122 20 -131 3 -12 -20 -26 -103 -59 -769 -305 -1337 -967 -1531 -1785 -52 -216 -66 -344 -65 -590 0 -289 30 -491 113 -762 l21 -71 150 86 c147 85 150 88 145 117 -73 426 29 855 284 1193 83 110 250 268 367 345 104 70 244 140 353 177 285 97 626 106 908 24 615 -178 1046 -702 1102 -1341 38 -423 -116 -859 -413 -1170 -147 -153 -335 -284 -517 -357 -200 -81 -376 -116 -592 -116 -345 0 -670 114 -944 331 l-61 48 -139 -80 c-76 -44 -143 -84 -147 -88 -12 -12 123 -153 258 -269 389 -335 890 -548 1413 -603 164 -17 514 -7 667 20 434 74 841 254 1163 514 l82 67 83 -67 c266 -215 596 -378 947 -468 228 -59 325 -70 615 -70 212 0 294 4 382 18 440 71 821 229 1164 484 115 85 287 240 352 316 l48 56 -93 54 c-51 30 -117 68 -147 85 l-55 31 -60 -48 c-203 -161 -443 -268 -694 -312 -129 -22 -348 -26 -465 -8 -941 140 -1531 1083 -1237 1979 206 630 785 1050 1448 1050 399 0 761 -146 1049 -424 276 -265 429 -583 464 -966 12 -123 5 -274 -17 -405 -5 -29 -3 -32 145 -116 l150 -86 22 71 c192 629 144 1285 -136 1871 -123 259 -266 464 -465 669 -269 276 -543 461 -883 596 -83 33 -106 47 -103 59 36 120 52 553 27 741 -78 587 -310 1071 -711 1484 -357 367 -791 610 -1282 719 l-68 15 0 -172 0 -173 38 -11 c57 -17 235 -106 316 -158 331 -214 572 -567 657 -962 29 -140 37 -383 15 -529 -63 -425 -301 -804 -659 -1047 -103 -69 -295 -160 -414 -195 -638 -188 -1321 59 -1697 612 -69 103 -160 295 -195 415 -87 296 -80 643 20 929 111 319 329 598 605 777 81 52 259 141 316 158 l38 11 0 174 c0 95 -1 173 -2 172 -2 -1 -28 -7 -58 -13z m-1162 -1078 c-303 -750 -81 -1615 545 -2122 218 -175 473 -302 732 -362 59 -13 233 -43 258 -44 4 0 7 -44 7 -98 l0 -98 -52 -17 c-207 -65 -378 -272 -416 -501 -14 -86 -14 -105 0 -182 l14 -85 -80 -49 -81 -48 -20 23 c-11 13 -54 65 -95 114 -413 501 -1112 742 -1764 610 -418 -85 -815 -329 -1075 -661 -29 -38 -55 -68 -57 -68 -2 0 8 30 21 67 137 363 355 677 638 920 255 217 529 363 872 464 61 17 111 33 112 34 2 1 -13 68 -32 149 -53 230 -69 377 -62 601 6 197 21 312 62 476 59 233 165 476 295 673 64 98 185 256 195 256 3 0 -5 -24 -17 -52z m3486 -68 c228 -303 366 -623 433 -1005 13 -77 17 -157 17 -340 0 -260 -7 -324 -64 -563 -17 -69 -29 -126 -28 -127 2 -1 59 -19 128 -39 251 -75 438 -160 634 -290 344 -228 632 -566 795 -934 50 -110 93 -222 87 -222 -2 0 -25 28 -52 62 -265 338 -660 582 -1080 667 -652 132 -1351 -109 -1764 -610 -41 -49 -84 -101 -95 -114 l-20 -23 -81 48 -80 49 14 85 c14 77 14 96 0 182 -38 229 -209 436 -415 501 l-53 17 0 97 0 98 48 6 c440 57 833 255 1130 569 489 517 633 1288 363 1955 -29 71 -12 58 83 -69z m-1667 -2972 c77 -29 152 -104 181 -181 80 -213 -73 -437 -298 -437 -176 0 -320 144 -320 320 0 225 224 378 437 298z m-516 -793 c87 -69 193 -115 304 -133 86 -14 104 -14 189 0 113 18 217 64 300 131 33 26 62 47 65 47 4 0 42 -21 85 -46 61 -36 76 -49 70 -62 -111 -258 -164 -504 -164 -762 0 -707 404 -1349 1040 -1654 174 -84 336 -132 575 -172 l40 -7 -35 -8 c-75 -17 -300 -39 -406 -39 -341 0 -687 80 -989 230 -221 108 -391 230 -582 414 l-93 89 -92 -89 c-192 -184 -362 -306 -583 -414 -403 -199 -885 -274 -1320 -204 -123 20 -126 18 65 53 380 72 758 288 1016 580 315 357 479 813 461 1286 -9 248 -58 459 -161 697 -6 13 9 26 71 62 43 25 80 46 82 46 3 0 31 -20 62 -45z"/>
              <path d="M4927 7030 c-281 -25 -576 -105 -819 -220 -38 -18 -68 -34 -68 -36 0 -22 150 -264 164 -264 1 0 43 17 92 39 292 126 563 178 888 168 305 -9 521 -61 843 -203 23 -11 186 248 166 266 -36 33 -337 145 -497 186 -222 56 -550 84 -769 64z"/>
              <path d="M2766 4513 l-38 -4 6 -72 c51 -559 285 -1067 676 -1471 96 -100 247 -227 347 -294 l55 -36 19 24 c11 14 45 76 76 139 48 96 54 115 41 122 -48 27 -215 165 -293 244 -334 331 -557 795 -602 1250 -8 79 -8 79 -40 86 -47 9 -201 17 -247 12z"/>
              <path d="M7293 4510 c-46 -5 -87 -11 -91 -14 -5 -3 -12 -40 -15 -82 -29 -340 -192 -746 -416 -1039 -81 -106 -196 -228 -282 -301 -88 -74 -169 -137 -195 -152 -14 -8 -11 -19 20 -86 43 -93 104 -196 117 -196 14 0 102 64 214 156 399 325 696 809 809 1316 26 114 64 384 55 392 -10 10 -141 13 -216 6z"/>
            </g>
          </svg>
          <span>Detox App</span>
        </h3>
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
            />
            {issues.length > 0 && (
              <AverageToxicScore issues={issues} host={host}/>
            )}
          </div>
        </div>
      )}

      <div className="widget-footer">
        <Link href="https://github.com/JetBrains/youtrack-issues-list-widget" target="_blank">
          View Source on GitHub
        </Link>
      </div>

      {/* Popup Card */}
      {popupVisible && (
        <PopupCard
          title={popupTitle}
          content={popupContent}
          position={popupPosition}
          onClose={closePopup}
        />
      )}
    </div>
  );
};

export const App = memo(AppComponent);
