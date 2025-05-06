import React from 'react';
import { Issue } from './toxic-score';

// Helper function to make a colored field presentation object
const makeColorFieldPresentationObject = (field: any) => {
  if (!field || !field.value) return null;

  return {
    id: field.value.id || '',
    name: field.value.name || '',
    color: field.value.color || ''
  };
};

// Helper function to check if a value is a colored value
const isColoredValue = (value: any) => {
  return value && typeof value.color === 'string' && value.color.length > 0;
};

// Helper function to convert to array
const toArray = (value: any) => {
  return Array.isArray(value) ? value : [value];
};

// Priority icon component
export interface PriorityIconProps {
  priority: Issue['priority'];
  issue?: Issue;
}

const PriorityIcon: React.FC<PriorityIconProps> = ({ priority, issue }) => {
  // If we have an issue with fields, try to extract priority from bundled fields
  let priorityFromFields = null;

  if (issue && issue.fields) {
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

    if (priorityField) {
      if (priorityField.value) {
        priorityFromFields = makeColorFieldPresentationObject(priorityField);
      }
    } else {
      const fieldWithColoredValues = (issue.fields || []).filter(
        (field: {
          projectCustomField: {
            field?: {
              name?: string;
            };
            bundle?: any;
          };
          value?: any;
        }) => toArray(field.value || []).some(isColoredValue)
      )[0];

      if (fieldWithColoredValues) {
        priorityFromFields = makeColorFieldPresentationObject(fieldWithColoredValues);
      }
    }
  }

  // Use priority from fields if available, otherwise use the provided priority
  const finalPriority = priorityFromFields || priority;

  // Map priority to a standardized value to ensure we have a matching CSS class
  let priorityValue = finalPriority.name.toLowerCase();

  // Default to 'normal' if the priority doesn't match any of our defined classes
  if (!['critical', 'high', 'normal', 'low'].includes(priorityValue)) {
    priorityValue = 'normal';
  }

  // Use the color from the priority object if available, otherwise use the CSS class
  const style = finalPriority.color ? { backgroundColor: finalPriority.color } : {};
  const priorityClass = `priority-icon priority-${priorityValue}`;

  return (
    <div className="priority-container">
      <span className={priorityClass} style={style}/>
      {finalPriority.name}
    </div>
  );
};

export default PriorityIcon;
