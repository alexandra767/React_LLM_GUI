import React from 'react';
import './ProgressBar.css';

const ProgressBar = ({ progress, isVisible = true }) => {
  if (!isVisible || !progress) return null;

  const { 
    currentStep = 0, 
    totalSteps = 1, 
    percentage = 0, 
    message = 'Generating...', 
    estimatedTime = null 
  } = progress;

  const progressPercentage = Math.min(100, Math.max(0, percentage || (currentStep / totalSteps) * 100));

  return (
    <div className="progress-bar-container">
      <div className="progress-info">
        <span className="progress-message">{message}</span>
        <span className="progress-stats">
          {currentStep}/{totalSteps} steps ({Math.round(progressPercentage)}%)
        </span>
      </div>
      
      <div className="progress-bar-track">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      {estimatedTime && (
        <div className="progress-time">
          <span>Est. {estimatedTime} remaining</span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;