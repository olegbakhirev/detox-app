import React, { useState, useEffect } from 'react';
import { Issue, getToxicScore, getScoreColor } from './toxic-score';
import { setToxicScoreCacheReady } from './toxic-score-cache';

interface AverageToxicScoreProps {
  issues: Issue[];
  host: any;
}

const AverageToxicScore: React.FC<AverageToxicScoreProps> = ({ issues, host }) => {
  const [averageToxicScore, setAverageToxicScore] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Calculate average toxic score
  useEffect(() => {
    let isMounted = true;

    const calculateAverageScore = async () => {
      if (issues.length === 0) {
        if (isMounted) {
          setAverageToxicScore(0);
          setLoading(false);
          // Set the toxicScoreCache to ready state even if there are no issues
          setToxicScoreCacheReady(true);
        }
        return;
      }

      try {
        // Fetch toxic scores for all issues
        const resultPromises = issues.map(issue => getToxicScore(issue, host, true));
        const results = await Promise.all(resultPromises);

        // Calculate average
        const sum = results.reduce((acc, val) => acc + val.toxicScore, 0);
        const average = sum / results.length;

        // Round to one decimal place
        const roundedAverage = Math.round(average);

        if (isMounted) {
          setAverageToxicScore(roundedAverage);
          setLoading(false);
          // Set the toxicScoreCache to ready state
          setToxicScoreCacheReady(true);
        }
      } catch (error) {
        console.error('Error calculating average toxic score:', error);
        if (isMounted) {
          setLoading(false);
          // Set the toxicScoreCache to ready state even if there's an error
          setToxicScoreCacheReady(true);
        }
      }
    };

    calculateAverageScore();

    return () => {
      isMounted = false;
    };
  }, [issues]);

  const scoreColor = getScoreColor(averageToxicScore);

  return (
    <div className="toxic-score">
      <div className="toxic-score-label">Average Toxic Score</div>
      {loading ? (
        <div className="toxic-score-loading">...</div>
      ) : (
        <div className="toxic-score-value" style={{ color: scoreColor }}>{`${averageToxicScore} %`}</div>
      )}
    </div>
  );
};

export default AverageToxicScore;
