import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';

const Header: React.FC = () => {
  const { 
    searchTerm, 
    setSearchTerm, 
    currentLanguage, 
    setCurrentLanguage, 
    t 
  } = useApp();
  
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleLanguageToggle = () => {


    setShowLanguageDropdown(!showLanguageDropdown);
  };

  const handleLanguageSelect = (lang: 'zh' | 'en') => {
    setCurrentLanguage(lang);
    setShowLanguageDropdown(false);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <header className="header">
      <div className="container">
        <h1 className="logo">
          <img src="/logo.svg" alt="Gallant Gallery" height="40" />
        </h1>
        
        <div className="search-container">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={t('search.placeholder')}
            className="search-input"
          />
          <i className="fas fa-search search-icon"></i>
        </div>
        
        <div className="header-controls">
          <div className="language-selector">
            <button 
              className="language-btn" 
              title={t('language.toggle')}
              onClick={handleLanguageToggle}
            >
              <i className="fas fa-globe"></i>
              <span>{currentLanguage === 'zh' ? '中' : 'EN'}</span>
            </button>
            
            {showLanguageDropdown && (
              <div className="language-dropdown">
                <div 
                  className="language-option" 
                  onClick={() => handleLanguageSelect('zh')}
                >
                  <span className="language-flag">🇨🇳</span>
                  <span>中文</span>
                </div>
                <div 
                  className="language-option" 
                  onClick={() => handleLanguageSelect('en')}
                >
                  <span className="language-flag">🇺🇸</span>
                  <span>English</span>
                </div>
              </div>
            )}
          </div>
          
          <button 
            className="refresh-btn" 
            title={t('refresh.tooltip')}
            onClick={handleRefresh}
          >
            <i className="fas fa-sync-alt"></i>
          </button>
          
          <button 
            className="daemon-btn" 
            title={t('daemon.tooltip')}
          >
            <i className="fas fa-robot"></i>
            <span className="daemon-status">●</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
