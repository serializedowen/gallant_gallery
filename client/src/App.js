import React from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import Header from './components/Header/Header';
import Navigation from './components/Navigation/Navigation';
import CategoryView from './components/Views/CategoryView/CategoryView';
import FolderView from './components/Views/FolderView/FolderView';
import GridView from './components/Views/GridView/GridView';
import './styles.css';

const AppContent = () => {
  const { currentView } = useApp();

  const renderCurrentView = () => {
    switch (currentView) {
      case 'categories':
        return <CategoryView />;
      case 'folders':
        return <FolderView />;
      case 'grid':
        return <GridView />;
      default:
        return <CategoryView />;
    }
  };

  return (
    <div className="App">
      <Header />
      <Navigation />
      <main className="main">
        <div className="container">
          {renderCurrentView()}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
