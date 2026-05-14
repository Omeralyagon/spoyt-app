import React from 'react';
import './PlanCard.css';

/**
 * PlanCard - Reusable component for displaying workout plans
 * Used in: HomePage, MyPlansPage
 */
function PlanCard({ plan, onClick }) {
  return (
    <article
      className="plan-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`פלאו: ${plan.name}`}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <div className="plan-card__header">
        <div className="plan-card__info">
          <h3 className="plan-card__name">{plan.name}</h3>
          <p className="plan-card__meta">
            {plan.exercises} תרגילים | {plan.category}
          </p>
        </div>
        {plan.badge && (
          <span className={`badge badge-${plan.badgeType || 'primary'}`}>
            {plan.badge}
          </span>
        )}
      </div>
      
      <div className="plan-card__footer">
        <div className="plan-card__stat">
          <span className="plan-card__stat-icon">⏱️</span>
          <span className="plan-card__stat-text">{plan.duration} דק'</span>
        </div>
        {plan.lastUsed && (
          <div className="plan-card__stat">
            <span className="plan-card__stat-text text-hint">{plan.lastUsed}</span>
          </div>
        )}
        {plan.music && (
          <div className="plan-card__stat">
            <span className="plan-card__stat-icon">🎵</span>
            <span className="plan-card__stat-text">{plan.music}</span>
          </div>
        )}
      </div>
    </article>
  );
}

export default PlanCard;
