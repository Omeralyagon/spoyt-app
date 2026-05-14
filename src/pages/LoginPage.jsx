import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

function LoginPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Dummy authentication - just navigate to home
    navigate('/home');
  };

  return (
    <main className="login-page">
      {/* Header */}
      <div className="login-page__header">
        <div className="login-page__logo">
          <span className="login-page__logo-icon">💪</span>
          <h1 className="login-page__logo-text">Spoyt</h1>
        </div>
        <p className="login-page__tagline">תכנן. אמן. הצלח.</p>
      </div>

      {/* Form */}
      <div className="login-page__card card">
        <h2 className="login-page__form-title">
          {isLogin ? 'כניסה לחשבון' : 'הרשמה לאפליקציה'}
        </h2>

        <form onSubmit={handleSubmit} className="login-page__form">
          {!isLogin && (
            <div className="login-page__field">
              <label htmlFor="name" className="login-page__label">שם מלא</label>
              <input
                id="name"
                name="name"
                type="text"
                className="input"
                placeholder="הכנס/י את שמך"
                value={formData.name}
                onChange={handleChange}
                required={!isLogin}
                autoComplete="name"
              />
            </div>
          )}

          <div className="login-page__field">
            <label htmlFor="email" className="login-page__label">אימייל</label>
            <input
              id="email"
              name="email"
              type="email"
              className="input"
              placeholder="כתובת אימייל"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          {!isLogin && (
            <div className="login-page__field">
              <label htmlFor="phone" className="login-page__label">טלפון</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="input"
                placeholder="מספר טלפון"
                value={formData.phone}
                onChange={handleChange}
                autoComplete="tel"
              />
            </div>
          )}

          <div className="login-page__field">
            <label htmlFor="password" className="login-page__label">סיסמה</label>
            <input
              id="password"
              name="password"
              type="password"
              className="input"
              placeholder="סיסמה"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full">
            {isLogin ? 'כניסה' : 'הרשמה'}
          </button>
        </form>

        <div className="login-page__toggle">
          <span className="text-secondary">
            {isLogin ? 'אין לך חשבון?' : 'כבר יש לך חשבון?'}
          </span>
          <button
            className="login-page__toggle-btn"
            onClick={() => setIsLogin(!isLogin)}
            type="button"
          >
            {isLogin ? 'הרשמה' : 'כניסה'}
          </button>
        </div>
      </div>

      {/* Quick access for demo */}
      <button
        className="login-page__demo-btn"
        onClick={() => navigate('/home')}
        type="button"
      >
        כניסה מהירה (דמו) →
      </button>
    </main>
  );
}

export default LoginPage;
