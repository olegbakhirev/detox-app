import React, { useState, useCallback, useEffect } from 'react';
import Button from '@jetbrains/ring-ui-built/components/button/button';
import QueryAssist, { QueryAssistResponse, QueryAssistRequestParams } from '@jetbrains/ring-ui-built/components/query-assist/query-assist';

// Define interfaces for QueryAssist
interface QueryAssistChange {
  query: string;
  caret?: number;
}

interface SearchInputProps {
  initialQuery: string;
  onQueryChange: (query: string) => void;
  host: any;
}

const SearchInput: React.FC<SearchInputProps> = ({ initialQuery, onQueryChange, host }) => {
  const [query, setQuery] = useState<string>(initialQuery);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  // Reset hasChanges when initialQuery changes
  useEffect(() => {
    setQuery(initialQuery);
    setHasChanges(false);
  }, [initialQuery]);

  // Handler for query changes
  const handleQueryChange = useCallback((change: QueryAssistChange) => {
    setQuery(change.query);
    setHasChanges(change.query !== initialQuery);
  }, [initialQuery]);

  // Handler for save button click
  const handleSave = useCallback(() => {
    onQueryChange(query);
    setHasChanges(false);
  }, [query, onQueryChange]);

  // Handler for ENTER key press
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && hasChanges) {
      event.preventDefault();
      handleSave();
    }
  }, [hasChanges, handleSave]);

  // Data source function for QueryAssist
  const dataSource = useCallback((params: QueryAssistRequestParams) => {
    // TODO - add query assist
    // try {
    //   const { query } = params;
    //   return host.fetchYouTrack(`api/search/assist?fields=query,caret&query=${encodeURIComponent(query)}`) as Promise<QueryAssistResponse>;
    // } catch (error) {
    //   console.error('Error fetching suggestions:', error);
    //   return Promise.resolve({
    //     query: params.query,
    //     caret: params.caret,
    //     suggestions: []
    //   });
    // }
    return Promise.resolve({
      query: params.query,
      caret: params.caret,
      suggestions: []
    });
  }, [host]);

  return (
    <div className="search-input-container" onKeyDown={handleKeyDown}>
      <div className="search-input-row">
        <QueryAssist
          placeholder="Search issues..."
          query={query}
          onChange={handleQueryChange}
          dataSource={dataSource}
        />
        {hasChanges && (
          <Button
            primary
            className="search-save-button"
            onClick={handleSave}
          >
            Save
          </Button>
        )}
      </div>
    </div>
  );
};

export default SearchInput;
