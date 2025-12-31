import { HashRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from './components/ErrorBoundary';
import ShopLayout from './components/ShopLayout';
import ShopSignup from './pages/Shop/Auth/ShopSignup';
import ShopDashboard from './pages/Shop/ShopDashboard';
import ShopSchedule from './pages/Shop/ShopSchedule';
import ShopServices from './pages/Shop/ShopServices';
import ShopBookings from './pages/Shop/ShopBookings';
import ShopSettings from './pages/Shop/ShopSettings';
import ShopLanding from './pages/Shop/ShopLanding';
import ShopLogin from './pages/Shop/Auth/ShopLogin';
import ShopRegister from './pages/Shop/Auth/ShopRegister';
import ShopOnboarding from './pages/Shop/ShopOnboarding';
import ShopsList from './pages/ShopsList';
import ShopDetails from './pages/ShopDetails';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminShops from './pages/Admin/AdminShops';
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
import { AnalyticsProvider } from './components/AnalyticsProvider';

// Wrapper to conditionally render Navbar
const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AnalyticsProvider>
      <div className="layout-content">
        <Navbar />
        <main className="main-container">
          {children}
        </main>
      </div>
    </AnalyticsProvider>
  );
};

// ... App component ...
function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
              <ErrorBoundary>
                <Routes>
                  {/* Main Website Layout */}
                  <Route element={<Layout><Outlet /></Layout>}>
                    {/* Public Routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/shops" element={<ShopsList />} />
                    <Route path="/shops/:id" element={<ShopDetails />} />
                    <Route path="/login" element={<Login />} />

                    {/* Public Business Landing */}
                    <Route path="/for-pet-businesses" element={<ShopLanding />} />

                    {/* Dedicated Shop Auth Routes (No layout or different layout) */}
                    <Route path="/shop/login" element={<ShopLogin />} />
                    <Route path="/shop/register" element={<ShopRegister />} />
                    <Route path="/shop/onboarding" element={<ProtectedRoute><ShopOnboarding /></ProtectedRoute>} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/safety" element={<Safety />} />
                    <Route path="/guidelines" element={<Guidelines />} />
                    <Route path="/support" element={<Support />} />

                    {/* Protected User Routes */}
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
                  </Route>

                  {/* Shop Owner Portal Layout */}
                  <Route path="/shop" element={<ShopLayout />}>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<ShopDashboard />} />
                    <Route path="schedule" element={<ShopSchedule />} />
                    <Route path="bookings" element={<ShopBookings />} />
                    <Route path="services" element={<ShopServices />} />
                    <Route path="settings" element={<ShopSettings />} />
                  </Route>

                  {/* Admin Portal Layout */}
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="shops" element={<AdminShops />} />
                  </Route>

                  {/* Shop Auth Routes */}
                  <Route path="/shop/signup" element={<ShopSignup />} />

                  {/* Shop Auth Routes (Outside Layouts or Custom) */}
                  {/* We can reuse main layout or blank. Let's use blank for simplicity or Main if we want Navbar. */}
                  {/* For now, just placeholder or reuse existing Login with logic? 
                        Plan says /shop/signup. Let's redirect standard login for now or basic route. 
                    */}
                </Routes>
              </ErrorBoundary>
            </div>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
