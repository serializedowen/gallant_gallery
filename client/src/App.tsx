import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header/Header';
import Navigation from './components/Navigation/Navigation';
import CategoryView from './components/Views/CategoryView/CategoryView';
import GridView from './components/Views/GridView/GridView';
import { CssBaseline, Container, Box } from '@mui/material';

const AppContent = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <Header />
      <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/categories" replace />} />
          <Route path="/categories" element={<CategoryView />} />
          <Route path="/category/:categoryName" element={<CategoryView />} />
          <Route path="/folder/:folderName" element={<GridView />} />
          <Route path="/grid" element={<GridView />} />
        </Routes>
      </Container>
      <Navigation />
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <Router>
          <AppContent />
        </Router>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
