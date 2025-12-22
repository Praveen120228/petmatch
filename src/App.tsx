import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import Onboarding from './pages/Onboarding';
import AddPet from './pages/AddPet';
import MatchFeed from './pages/MatchFeed';
import PetProfile from './pages/PetProfile';
import Messages, { MessagesPlaceholder } from './pages/Messages';
import Profile from './pages/Profile';
import ChatRoom from './pages/ChatRoom';
import ChatSettings from './pages/ChatSettings';
import LandingPage from './pages/LandingPage';
import About from './pages/About';
import Safety from './pages/Safety';
import Guidelines from './pages/Guidelines';
import Support from './pages/Support';

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
            <ErrorBoundary>
              <Layout>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/safety" element={<Safety />} />
                  <Route path="/guidelines" element={<Guidelines />} />
                  <Route path="/support" element={<Support />} />

                  {/* Protected Routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/onboarding" element={<Onboarding />} />
                    <Route path="/add-pet" element={<AddPet />} />
                    <Route path="/match" element={<MatchFeed />} />
                    <Route path="/pet/:id" element={<PetProfile />} />
                    <Route path="/messages" element={<Messages />}>
                      <Route index element={<MessagesPlaceholder />} />
                      <Route path=":id" element={<ChatRoom />} />
                    </Route>
                    <Route path="/messages/:id/info" element={<ChatSettings />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/user/:id" element={<Profile />} />
                  </Route>
                </Routes>
              </Layout>
            </ErrorBoundary>
          </div>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
