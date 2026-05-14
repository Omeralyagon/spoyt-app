import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PlanCard from '../components/PlanCard';
import './MyPlansPage.css';

const ALL_PLANS = [
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
  {
    id: 4,
    name: 'פילאטיס מתחילים',
    exercises: 7,
    category: 'פילאטיס',
    duration: 40,
    lastUsed: 'לפני שבועיים',
    music: 'Calm Flow',
  },
  {
    id: 5,
    name: 'ריצה אינטרוולים',
    exercises: 5,
    category: 'קרדיו',
    duration: 35,
    lastUsed: 'לפני 5 ימים',
  },
];

const CATEGORIES = ['הכל', 'יוגה', 'קרדיו', 'כוח', 'פילאטיס', 'HIIT'];

function MyPlansPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('הכל');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPlans = ALL_PLANS.filter((plan) => {
    const matchesCategory = selectedCategory === 'הכל' || 
      plan.category === selectedCategory ||
      (selectedCategory === 'HIIT' && plan.name.includes('HIIT'));
    const matchesSearch = plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <main className="page my-plans-page">
      {/* Header */}
      <header className="my-plans-page__header">
        <h1 className="my-plans-page__title">הפלאנים שלי</h1>
        <button
          className="btn btn-primary my-plans-page__add-btn"
          onClick={() => navigate('/create-plan')}
          aria-label="צור פלאו חדש"
        >
          + חדש
        </button>
      </header>

      {/* Search */}
      <div className="my-plans-page__search">
        <input
          type="search"
          className="input"
          placeholder="חיפוש פלאו, תרגיל..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="חיפוש פלאנים"
        />
      </div>

      {/* Category Filter */}
      <div
        className="my-plans-page__categories"
        role="tablist"
        aria-label="סינון לפי קטגוריה"
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`my-plans-page__cat-btn ${selectedCategory === cat ? 'my-plans-page__cat-btn--active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
            role="tab"
            aria-selected={selectedCategory === cat}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Plans List */}
      <section
        className="my-plans-page__list"
        aria-label={`${filteredPlans.length} פלאנים`}
      >
        {filteredPlans.length > 0 ? (
          filteredPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onClick={() => navigate(`/plan/${plan.id}`)}
            />
          ))
        ) : (
          <div className="my-plans-page__empty" role="status">
            <span className="my-plans-page__empty-icon">🏋️</span>
            <p className="my-plans-page__empty-text">לא נמצאו פלאנים</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/create-plan')}
            >
              צור פלאו ראשון
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

export default MyPlansPage;
