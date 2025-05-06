import React from 'react';
import SmartTable from '@jetbrains/ring-ui-built/components/table/smart-table';
import {Column} from '@jetbrains/ring-ui-built/components/table/header-cell';
import Selection from '@jetbrains/ring-ui-built/components/table/selection';
import { Issue } from './toxic-score';

interface IssuesListProps {
  issues: Issue[];
  columns: Column<Issue>[];
  onItemClick: (item: Issue, e: React.MouseEvent<HTMLTableRowElement>) => void;
  onSelectionChange: (selection: Selection<Issue>) => void;
}

const IssuesList: React.FC<IssuesListProps> = ({
  issues,
  columns,
  onItemClick,
  onSelectionChange
}) => {
  return (
    <div className="issues-list">
      {issues.length === 0 ? (
        <div className="no-issues">
          <p>No issues found</p>
        </div>
      ) : (
        <SmartTable
          data={issues}
          columns={columns}
          onItemClick={onItemClick}
          onSelectionChange={onSelectionChange}
          selectable
          draggable={false}
          stickyHeader
        />
      )}
    </div>
  );
};

export default IssuesList;
