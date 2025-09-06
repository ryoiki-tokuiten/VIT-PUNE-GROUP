import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { InviteModalProvider } from './contexts/InviteModalContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import DashboardPage from './pages/DashboardPage';
import MyTasksPage from './pages/MyTasksPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ChatPage from './pages/ChatPage';
import InviteTeammateModal from './components/modals/InviteTeammateModal';
import { useInviteModal } from './contexts/InviteModalContext';
import './App.css';

const AppContent = () => {
  const { isOpen, projectId, closeInviteModal } = useInviteModal();

  const handleInviteClose = (success) => {
    closeInviteModal();
    if (success) {
      // Optionally refresh data or show success message
    }
  };

  return (
    <>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<SignupForm />} />
          
          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Navigate to="/tasks" replace />
            </ProtectedRoute>
          } />
          
          <Route path="/projects" element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/projects/:id" element={
            <ProtectedRoute>
              <Layout>
                <ProjectDetailPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/tasks" element={
            <ProtectedRoute>
              <Layout>
                <MyTasksPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/team" element={
            <ProtectedRoute>
              <Layout>
                <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                  <h2>Team Management</h2>
                  <p>Coming soon...</p>
                </div>
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/inbox" element={
            <ProtectedRoute>
              <Layout>
                <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                  <h2>Inbox</h2>
                  <p>Direct messaging coming soon...</p>
                </div>
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/chat" element={
            <ProtectedRoute>
              <Layout>
                <ChatPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/tasks" replace />} />
        </Routes>
      </Router>
      
      <InviteTeammateModal 
        isOpen={isOpen}
        projectId={projectId}
        onClose={handleInviteClose}
      />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <InviteModalProvider>
        <AppContent />
      </InviteModalProvider>
    </AuthProvider>
  );
}

export default App;
