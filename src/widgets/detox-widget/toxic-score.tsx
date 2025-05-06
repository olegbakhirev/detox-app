import React, { useState, useEffect } from 'react';

// Define the issue type
export interface Issue {
  id: string;
  summary: string;
  status: string;
  priority: {
    id: string;
    name: string;
    color?: string;
  };
  assignee?: string;
  created: string;
  updated: string;
  fields?: Array<{
    projectCustomField: {
      field?: {
        name?: string;
      };
      bundle?: any;
    };
    value?: any;
  }>;
}

export interface ToxicAnalysisResponse {
  toxicScore: number;
}

// Host is now passed as a prop

// Cache for toxic scores to avoid repeated API calls
const toxicScoreCache: Record<string, number> = {};

// Utility function to get toxic score based on issue summary
export const getToxicScore = async (issue: Issue, host: any): Promise<number> => {
  // If we already have a cached score for this summary, return it
  if (toxicScoreCache[issue.summary]) {
    return toxicScoreCache[issue.summary];
  }

  try {
    // Call the analyze-toxic endpoint to get a score based on the issue summary
    const result = await host.fetchApp('backend/analyze-toxic', {method: 'POST', body: {issueId: issue.id}}) as ToxicAnalysisResponse;

    if (result && typeof result.toxicScore === 'number') {
      // Cache the result
      toxicScoreCache[issue.summary] = result.toxicScore;
      return result.toxicScore;
    }
  } catch (error) {
    console.error('Error getting toxic score:', error);
  }

  // Fallback to priority-based score if API call fails
  // Extract priority from bundled fields
  let priorityFromFields = null;

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
  const finalPriority = priorityFromFields || issue.priority;

  const priorityLower = finalPriority.name.toLowerCase();
  let fallbackScore;
  switch (priorityLower) {
    case 'critical': fallbackScore = 10; break;
    case 'high': fallbackScore = 7; break;
    case 'normal': fallbackScore = 3; break;
    case 'low': fallbackScore = 0; break;
    default: fallbackScore = 3; // Default to normal if unknown
  }

  // Cache the fallback score
  toxicScoreCache[issue.summary] = fallbackScore;
  return fallbackScore;
};

// Utility function to get color based on score (0 = green, 5 = yellow, 10 = red)
export const getScoreColor = (score: number) => {
  // Ensure score is within 0-10 range
  const clampedScore = Math.max(0, Math.min(10, score));

  // Use Ring UI colors for the gradient
  // Low (0): #8c9fb5 (blue-gray) - from .priority-low
  // Normal (3): #59a869 (green) - from .priority-normal
  // High (7): #f0ad4e (orange) - from .priority-high
  // Critical (10): #e5493a (red) - from .priority-critical

  // Helper function to interpolate between two colors
  const interpolateColor = (color1: string, color2: string, factor: number) => {
    // Parse hex colors to RGB
    const r1 = parseInt(color1.substring(1, 3), 16);
    const g1 = parseInt(color1.substring(3, 5), 16);
    const b1 = parseInt(color1.substring(5, 7), 16);

    const r2 = parseInt(color2.substring(1, 3), 16);
    const g2 = parseInt(color2.substring(3, 5), 16);
    const b2 = parseInt(color2.substring(5, 7), 16);

    // Interpolate RGB values
    const r = Math.round(r1 + factor * (r2 - r1));
    const g = Math.round(g1 + factor * (g2 - g1));
    const b = Math.round(b1 + factor * (b2 - b1));

    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  // Define color stops
  const colorStops = [
    { score: 0, color: '#8c9fb5' },  // Low
    { score: 3, color: '#59a869' },  // Normal
    { score: 7, color: '#f0ad4e' },  // High
    { score: 10, color: '#e5493a' }  // Critical
  ];

  // Find the two color stops to interpolate between
  for (let i = 0; i < colorStops.length - 1; i++) {
    if (clampedScore >= colorStops[i].score && clampedScore <= colorStops[i + 1].score) {
      const factor = (clampedScore - colorStops[i].score) / (colorStops[i + 1].score - colorStops[i].score);
      return interpolateColor(colorStops[i].color, colorStops[i + 1].color, factor);
    }
  }

  // Fallback (should never reach here due to clamping)
  return colorStops[colorStops.length - 1].color;
};

// Component to display toxic score with color
const ToxicScore: React.FC<{ issue: Issue, host: any }> = ({ issue, host }) => {
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const fetchScore = async () => {
      try {
        const toxicScore = await getToxicScore(issue, host);
        if (isMounted) {
          setScore(toxicScore);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching toxic score:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchScore();

    return () => {
      isMounted = false;
    };
  }, [issue]);

  if (loading) {
    return <div>...</div>;
  }

  if (score === null) {
    return <div>N/A</div>;
  }

  const scoreColor = getScoreColor(score);
  return (
    <div style={{ color: scoreColor, fontWeight: 'bold' }}>
      {score.toFixed(1)}
    </div>
  );
};

export default ToxicScore;
