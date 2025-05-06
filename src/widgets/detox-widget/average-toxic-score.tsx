import React, { useState, useEffect } from 'react';
import { Issue, getToxicScore, getScoreColor } from './toxic-score';

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
        }
        return;
      }

      try {
        // Fetch toxic scores for all issues
        const scorePromises = issues.map(issue => getToxicScore(issue, host));
        const scores = await Promise.all(scorePromises);

        // Calculate average
        const sum = scores.reduce((acc, val) => acc + val, 0);
        const average = sum / scores.length;

        // Round to one decimal place
        const roundedAverage = Math.round(average * 10) / 10;

        if (isMounted) {
          setAverageToxicScore(roundedAverage);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error calculating average toxic score:', error);
        if (isMounted) {
          setLoading(false);
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
        <div className="toxic-score-value">...</div>
      ) : (
        <div className="toxic-score-value" style={{ color: scoreColor }}>{averageToxicScore.toFixed(1)}</div>
      )}
    </div>
  );
};

export default AverageToxicScore;
