import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreatePlanPage.css';

const CATEGORIES = ['יוגה', 'קרדיו', 'כוח', 'פילאטיס', 'HIIT', 'ריצה', 'כדורגל'];
const DURATIONS = [15, 20, 30, 45, 60, 90];

const EXERCISES_POOL = {
  'יוגה': ['תנוחת הר', 'כלב מביט למטה', 'תנוחת לוחם', 'תנוחת ילד', 'עץ', 'גשר'],
  'קרדיו': ['קפיצות בוקסר', 'ריצה במקום', 'כוכבים', 'ברפי', 'ניתור כפוף'],
  'כוח': ['שכיבות סמיכה', 'מתח', 'סקוואט', 'לאנג'ס', 'מקבילים', 'פלאנק'],
  'HIIT': ['ברפי', 'ספרינט', 'קפיצות', 'קרוס פיט', 'טאבטה'],
};

function CreatePlanPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    duration: 30,
    exercises: [],
    music: '',
    notes: '',
  });
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const toggleExercise = (exercise) => {
    const exercises = formData.exercises.includes(exercise)
      ? formData.exercises.filter((e) => e !== exercise)
      : [...formData.exercises, exercise];
    handleChange('exercises', exercises);
  };

  const availableExercises = EXERCISES_POOL[formData.category] || [];

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => navigate('/my-plans'), 1500);
  };

  if (submitted) {
    return (
      <main className="page create-plan-page create-plan-page--success">
        <div className="create-plan-page__success">
          <span className="create-plan-page__success-icon">✅</span>
          <h2>הפלאו נשמר!</h2>
          <p className="text-secondary">מעביר אותך לרשימת הפלאנים...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page create-plan-page">
      {/* Header */}
      <header className="create-plan-page__header">
        <button
          className="create-plan-page__back-btn"
          onClick={() => navigate(-1)}
          aria-label="חזרה"
        >
          ← חזרה
        </button>
        <button
          className="create-plan-page__save-btn"
          onClick={handleSubmit}
          disabled={!formData.name || !formData.category}
        >
          שמור
        </button>
      </header>

      <h1 className="create-plan-page__title">בניית פלאו חדש</h1>

      <form className="create-plan-page__form" onSubmit={handleSubmit}>
        {/* Plan Name */}
        <div className="create-plan-page__field">
          <label className="create-plan-page__label" htmlFor="plan-name">
            שם הפלאו
          </label>
          <input
            id="plan-name"
            type="text"
            className="input"
            placeholder="פלאו בוקר יוגה אנרגטי"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
          />
        </div>

        {/* Category */}
        <div className="create-plan-page__field">
          <label className="create-plan-page__label">קטגוריה</label>
          <div className="create-plan-page__categories">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`create-plan-page__cat-btn ${formData.category === cat ? 'create-plan-page__cat-btn--active' : ''}`}
                onClick={() => handleChange('category', cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="create-plan-page__field">
          <label className="create-plan-page__label" htmlFor="duration">
            משך זמן
          </label>
          <select
            id="duration"
            className="input"
            value={formData.duration}
            onChange={(e) => handleChange('duration', parseInt(e.target.value))}
          >
            {DURATIONS.map((d) => (
              <option key={d} value={d}>{d} דקות</option>
            ))}
          </select>
        </div>

        {/* Exercises */}
        {formData.category && availableExercises.length > 0 && (
          <div className="create-plan-page__field">
            <label className="create-plan-page__label">
              ספריית תרגילים
              <span className="create-plan-page__count">
                ({formData.exercises.length} נבחרו)
              </span>
            </label>
            <div className="create-plan-page__exercises">
              {availableExercises.map((exercise) => (
                <button
                  key={exercise}
                  type="button"
                  className={`create-plan-page__exercise-btn ${formData.exercises.includes(exercise) ? 'create-plan-page__exercise-btn--selected' : ''}`}
                  onClick={() => toggleExercise(exercise)}
                >
                  {formData.exercises.includes(exercise) && (
                    <span className="create-plan-page__check">✓</span>
                  )}
                  {exercise}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Music */}
        <div className="create-plan-page__field">
          <label className="create-plan-page__label" htmlFor="music">
            פלייליסט מוזיקה (אופציונלי)
          </label>
          <input
            id="music"
            type="text"
            className="input"
            placeholder="Morning Vibes, Energy Boost..."
            value={formData.music}
            onChange={(e) => handleChange('music', e.target.value)}
          />
        </div>

        {/* Submit */}
        <div className="create-plan-page__actions">
          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={!formData.name || !formData.category}
          >
            שמור פלאו
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-full"
            onClick={() => navigate(-1)}
          >
            ביטול
          </button>
        </div>
      </form>
    </main>
  );
}

export default CreatePlanPage;
