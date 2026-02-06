import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import TaskLog from './pages/taskLog';
import EmployeeSummaries from './pages/employeeSummaries';
import AdminDashboard from './pages/AdminDashboard';
import AnalyticsView from './components/AnalyticsView';
import ProjectManager from './pages/ProjectManager';
import UpdateProject from './pages/UpdateProject';
import Home from './pages/Home'

// Layout Components
import Navbar from './components/Navbar';
import Unauthorized from './pages/Unauthorized';
import Footer from './components/Footer';

const App = () => {
  return (
    <Router>
      <AuthProvider>

        <div className="site-wrapper">
          <Navbar />
          <main className="container">
            <Routes>
              {/* Public Routes */}
              <Route path="/home" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Employee & Admin Shared Access (Logging Tasks) */}
              <Route element={<ProtectedRoute allowedRoles={['employee', 'admin']} />}>
                <Route path="/employee-summaries" element={<EmployeeSummaries />} />
                <Route path="/task-log" element={<TaskLog />} />
              </Route>

              {/* Admin Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/analytics" element={<AnalyticsView />} />
                <Route path="/project-manager" element={<ProjectManager />} />
                <Route path="/admin/projects" element={<ProjectManager />} /> {/* Backward compatibility */}
                <Route path="/update-project/:id" element={<UpdateProject />} />
              </Route>

              {/* Root Redirect */}
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="*" element={<h1>404: Page Not Found</h1>} />
            </Routes>
          </main>
          <Footer />
        </div>
         
      </AuthProvider>
    </Router>
  );
};

export default App;
