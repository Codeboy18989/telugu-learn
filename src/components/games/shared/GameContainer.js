// GameContainer - Wrapper for all game modes
import React from 'react';
import './GameContainer.css';

function GameContainer({ children, title, onExit, className = '' }) {
  return (
    <div className={`game-container ${className}`}>
      <div className="game-header">
        {onExit && (
          <button onClick={onExit} className="exit-game-btn" title="Exit game">
            ← Back
          </button>
        )}
        {title && <h2 className="game-title">{title}</h2>}
      </div>

      <div className="game-content">
        {children}
      </div>
    </div>
  );
}

export default GameContainer;
