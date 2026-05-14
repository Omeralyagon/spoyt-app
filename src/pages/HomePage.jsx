import React from 'react';
import { useNavigate } from 'react-router-dom';
import PlanCard from '../components/PlanCard';
import './HomePage.css';

// Dummy data
const USER = {
  name: 'דנה',
  plansThisYear: 12,
  plansThisMonth: 8,
  points: 143,
};

const RECENT_PLANS = [
  {
    id: 1,
    name: 'פלאו בוקר יוגה אנרגטי',
    exercises: 6,
    category: 'יוגה',
    duration: 30,
    lastUsed: 'לפני שבוע',
    music: 'Morning Vibes',
  },
  {
    id: 2,
    name: 'קרדיו אינטנסיבי HIIT',
    exercises: 8,
    category: 'Power Mix',
    duration: 45,
    badge: 'פרמיום',
    badgeType: 'warning',
    music: 'Energy Boost',
    lastUsed: 'אתמול',
  },
  {
    id: 3,
    name: 'כוח פלג גוף עליון',
    exercises: 10,
    category: 'כוח',
    duration: 50,
    lastUsed: 'לפני 3 ימים',
  },
];

function HomePage() {
  const navigate = useNavigate();

  return (
    <main className="page home-page">
      {/* Header */}
      <header className="home-page__header">
        <div className="home-page__greeting">
          <h1 className="home-page__title">
            שלום, {USER.name} 👋
          </h1>
          <p className="home-page__subtitle">מה נעשה היום?</p>
        </div>
        <button
          className="home-page__profile-btn"
          onClick={() => navigate('/profile')}
          aria-label="פרופיל"
        >
          <span className="home-page__profile-avatar">
            {USER.name.charAt(0)}
          </span>
        </button>
      </header>

      {/* Stats Section */}
      <section className="home-page__stats" aria-label="סטטיסטיקות">
        <div className="stat-card">
          <span className="stat-card__value">{USER.plansThisYear}</span>
          <span className="stat-card__label">פלאנים שנתי</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value">{USER.plansThisMonth}</span>
          <span className="stat-card__label">פלאנים שותמו</span>
        </div>
        <div className="stat-card stat-card--highlight">
          <span className="stat-card__value">{USER.points}</span>
          <span className="stat-card__label">לקים להצלחה</span>
        </div>
      </section>

      {/* Recent Plans Section */}
      <section className="home-page__plans" aria-label="פלאנים אחרונים">
        <div className="home-page__section-header">
          <h2 className="home-page__section-title">הפלאנים שלי</h2>
          <button
            className="home-page__see-all"
            onClick={() => navigate('/my-plans')}
          >
            +חדש
          </button>
        </div>

        <div className="home-page__plans-list">
          {RECENT_PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onClick={() => navigate(`/plan/${plan.id}`)}
            />
          ))}
        </div>
      </section>

      {/* Action Buttons */}
      <section className="home-page__actions" aria-label="פעולות מהירות">
        <button
          className="btn btn-primary btn-full"
          onClick={() => navigate('/create-plan')}
        >
          + צור פלאו חדש
        </button>
        <button
          className="btn btn-secondary btn-full"
          onClick={() => navigate('/discover')}
        >
          הצע פלאו אוטומטי
        </button>
      </section>
    </main>
  );
}

export default HomePage;
