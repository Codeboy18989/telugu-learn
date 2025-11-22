// ProgressBar - Shows progress through questions
import React from 'react';
import './ProgressBar.css';

function ProgressBar({ current, total, showNumbers = true }) {
  const percentage = (current / total) * 100;

  return (
    <div className="progress-bar-game">
      {showNumbers && (
        <div className="progress-numbers">
          Question {current} of {total}
        </div>
      )}
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
