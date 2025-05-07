import React, { useState, useEffect } from 'react';
import { Issue, ToxicAnalysisResponse } from './toxic-score';
import { getToxicScoreCacheValue } from './toxic-score-cache';

interface EmotionalTemperatureProps {
  issue: Issue;
  host: any;
}

const EmotionalTemperature: React.FC<EmotionalTemperatureProps> = ({ issue, host }) => {
  const [emotionalTemp, setEmotionalTemp] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const fetchEmotionalTemperature = async () => {
      try {
        // Try to get the cached toxic score analysis for this issue
        const cachedAnalysis = await getToxicScoreCacheValue(issue.summary, 10000, false);

        if (isMounted) {
          if (cachedAnalysis && cachedAnalysis.toxicGrow !== undefined) {
            setEmotionalTemp(cachedAnalysis.toxicGrow);
          } else {
            setEmotionalTemp(null);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching emotional temperature:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchEmotionalTemperature();

    return () => {
      isMounted = false;
    };
  }, [issue]);

  if (loading) {
    return <div>...</div>;
  }

  if (emotionalTemp === null) {
    return <div>N/A</div>;
  }

  // Render a visual representation of the trend
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {emotionalTemp === 1 ? (
        // Rising trend - upward arrow in red
        <div style={{ color: '#e5493a', fontWeight: 'bold' }}>
          ↑ Rise
        </div>
      ) : emotionalTemp === -1 ? (
        // Falling trend - downward arrow in green
        <div style={{ color: '#59a869', fontWeight: 'bold' }}>
          ↓ Calm
        </div>
      ) : (
        // Neutral trend - horizontal arrow in yellow
        <div style={{ color: '#f0ad4e', fontWeight: 'bold' }}>
          → Stay
        </div>
      )}
    </div>
  );
};

export default EmotionalTemperature;
