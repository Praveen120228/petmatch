import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import Onboarding from './pages/Onboarding';
import MatchFeed from './pages/MatchFeed';
import PetProfile from './pages/PetProfile';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import ChatRoom from './pages/ChatRoom';
import ChatSettings from './pages/ChatSettings';
import LandingPage from './pages/LandingPage';

import { ToastProvider } from './context/ToastContext';

// Wrapper to conditionally render Navbar
const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Navbar />
      <div className="content-container" style={{ flex: 1 }}>
        {children}
      </div>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Layout>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/match" element={<MatchFeed />} />
                  <Route path="/pet/:id" element={<PetProfile />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/messages/:id" element={<ChatRoom />} />
                  <Route path="/messages/:id/info" element={<ChatSettings />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/user/:id" element={<Profile />} />
                </Route>
              </Routes>
            </Layout>
          </div>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
