import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PlanCard from '../components/PlanCard';
import './DiscoverPage.css';

const FEATURED_PLANS = [
  {
    id: 10,
    name: 'מתחילים - HIIT 20 דקות',
    exercises: 6,
    category: 'HIIT',
    duration: 20,
    badge: 'מומלץ',
    badgeType: 'primary',
    music: 'Starter Pack',
  },
  {
    id: 11,
    name: 'יוגה לשיפור שינה',
    exercises: 8,
    category: 'יוגה',
    duration: 30,
    badge: 'פופולרי',
    badgeType: 'primary',
    music: 'Night Calm',
  },
  {
    id: 12,
    name: 'כוח מלא - Full Body',
    exercises: 12,
    category: 'כוח',
    duration: 60,
    badge: 'מתקדם',
    badgeType: 'warning',
  },
];

function DiscoverPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = FEATURED_PLANS.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="page discover-page">
      <header className="discover-page__header">
        <h1 className="discover-page__title">גלה פלאנים</h1>
        <p className="discover-page__subtitle">פלאנים מומלצים לאימון</p>
      </header>

      <div className="discover-page__search">
        <input
          type="search"
          className="input"
          placeholder="חיפוש פלאנים..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <section>
        <h2 className="discover-page__section-title">פלאנים מומלצים 🔥</h2>
        <div className="discover-page__list">
          {filtered.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onClick={() => navigate('/create-plan')}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

export default DiscoverPage;
