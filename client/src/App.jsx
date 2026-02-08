import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import TaskLog from './pages/taskLog';
import EmployeeSummaries from './pages/employeeSummaries';
import AdminDashboard from './pages/AdminDashboard';
import AnalyticsView from './components/AnalyticsView';
import ProjectManager from './pages/ProjectManager';
import UpdateProject from './pages/UpdateProject';
import Home from './pages/Home';
import Unauthorized from './pages/Unauthorized';
import Notes from './pages/Notes';
import ProjectDetails from './pages/ProjectDetails';

// Layout Components
import Navbar from './components/Navbar';
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
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/contact-admin" element={<Unauthorized message="Please contact your administrator to request access to the GDEA portal." />} />

              {/* Staff & Admin Shared Access (Logging Tasks) */}
              <Route element={<ProtectedRoute allowedRoles={['staff', 'admin']} />}>
                <Route path="/employee-summaries" element={<EmployeeSummaries />} />
                <Route path="/task-log" element={<TaskLog />} />
                <Route path="/notes" element={<Notes />} />
              </Route>

              {/* Admin Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/analytics" element={<AnalyticsView />} />
                <Route path="/project-manager" element={<ProjectManager />} />
                <Route path="/admin/projects" element={<ProjectManager />} />
                <Route path="/update-project/:id" element={<UpdateProject />} />
                <Route path="/project-details/:projectId" element={<ProjectDetails />} />
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
