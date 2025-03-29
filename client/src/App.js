// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login/Login';
import AdminDashboard from './components/AdminDashboard';
import EvaluatorDashboard from './components/EvaluatorDashboard';
import PapersList from './components/PapersList';
import PaperEvaluation from './components/PaperEvaluation';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  
  if (!token) {
    return <Navigate to="/" />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route 
          path="/admin/dashboard/*" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/evaluator/dashboard" 
          element={
            <ProtectedRoute>
              <EvaluatorDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/evaluator/evaluation/:id" 
          element={
            <ProtectedRoute>
              <PapersList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/evaluator/paper/:evaluationId/:submissionId" 
          element={
            <ProtectedRoute>
              <PaperEvaluation />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;