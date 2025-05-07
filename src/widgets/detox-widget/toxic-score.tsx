import React, { useState, useEffect } from 'react';
import { toxicScoreCache, getToxicScoreCacheValue, setToxicScoreCacheValue, isToxicScoreCacheReady } from './toxic-score-cache';

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
  aiSummary?: string;
  toxicGrow?: number;
  toxicScore_for_TopicStarter?: string;
  toxicScore_for_Commenters?: string;
}


// Host is now passed as a prop

// Utility function to get toxic score based on issue summary
export const getToxicScore = async (issue: Issue, host: any, dontWaitForCache: boolean = false): Promise<ToxicAnalysisResponse> => {
  // If we already have a cached score for this summary, return it
  const cachedValue = await getToxicScoreCacheValue(issue.summary, 10000, dontWaitForCache);
  if (cachedValue) {
    return cachedValue;
  }

  try {
    // Call the analyze-toxic endpoint to get a score based on the issue summary
    const result = await host.fetchApp('backend/analyze-toxic', {method: 'POST', body: {issueId: issue.id}}) as ToxicAnalysisResponse;

    if (result && typeof result.toxicScore === 'number') {
      // Cache the result
      const toxicScoreResult: ToxicAnalysisResponse = {
        toxicScore: result.toxicScore,
        aiSummary: result.aiSummary,
        toxicGrow: result.toxicGrow,
        toxicScore_for_TopicStarter: result.toxicScore_for_TopicStarter,
        toxicScore_for_Commenters: result.toxicScore_for_Commenters,
      };
      setToxicScoreCacheValue(issue.summary, toxicScoreResult);
      return toxicScoreResult;
    }
  } catch (error) {
    console.error('Error getting toxic score:', error);
  }
  return  {
    toxicScore: -1,
    aiSummary: "No toxic score got from AI",
    toxicGrow: 0,
    toxicScore_for_TopicStarter: "N/A",
    toxicScore_for_Commenters: "N/A"
  }
};

// Utility function to get color based on score (0 = green, 50 = yellow, 100 = red)
export const getScoreColor = (score: number) => {
  // Ensure score is within 0-100 range
  const clampedScore = Math.max(0, Math.min(100, score));

  // Use Ring UI colors for the gradient
  // Low (0): #8c9fb5 (blue-gray) - from .priority-low
  // Normal (30): #59a869 (green) - from .priority-normal
  // High (70): #f0ad4e (orange) - from .priority-high
  // Critical (100): #e5493a (red) - from .priority-critical

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

  // Define color stops with Ring UI colors
  const colorStops = [
    { score: 0, color: '#8c9fb5' },  // Low
    { score: 30, color: '#59a869' },  // Normal
    { score: 70, color: '#f0ad4e' },  // High
    { score: 100, color: '#e5493a' }  // Critical
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
  const [result, setResult] = useState<ToxicAnalysisResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const fetchScore = async () => {
      try {
        // Check if the cache is ready before using it
        const toxicScoreResult = await getToxicScore(issue, host, false);
        if (isMounted) {
          setResult(toxicScoreResult);
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
  }, [issue, host]);

  // Add a useEffect to check if the cache is ready
  useEffect(() => {
    // If the cache is ready and we're still loading, try to get the score from the cache
    if (isToxicScoreCacheReady() && loading) {
      const fetchCachedValue = async () => {
        const cachedValue = await getToxicScoreCacheValue(issue.summary, 5000, true);
        if (cachedValue) {
          setResult(cachedValue);
          setLoading(false);
        }
      };

      fetchCachedValue();
    }
  }, [issue.summary, loading]);

  if (loading) {
    return <div>...</div>;
  }

  if (result === null || result.toxicScore === -1) {
    return <div>N/A</div>;
  }

  const scoreColor = getScoreColor(result.toxicScore);
  return (
    <div style={{ color: scoreColor, fontWeight: 'bold' }}>
      {result.toxicScore}
    </div>
  );
};

export default ToxicScore;
