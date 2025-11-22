// StarRating - Display stars earned
import React from 'react';
import './StarRating.css';

function StarRating({ stars, maxStars = 3, size = 'medium', showCount = false }) {
  const sizeClass = `star-${size}`;

  return (
    <div className={`star-rating ${sizeClass}`}>
      {[...Array(maxStars)].map((_, index) => (
        <span
          key={index}
          className={`star ${index < stars ? 'star-filled' : 'star-empty'}`}
        >
          {index < stars ? '⭐' : '☆'}
        </span>
      ))}
      {showCount && (
        <span className="star-count">{stars}/{maxStars}</span>
      )}
    </div>
  );
}

export default StarRating;
