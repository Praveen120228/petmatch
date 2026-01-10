import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Suspense, lazy } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import { ToastProvider } from './context/ToastContext';
import { AnalyticsProvider } from './components/AnalyticsProvider';
import { CircleNotch } from '@phosphor-icons/react';

// Lazy Load Pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Signup = lazy(() => import('./pages/Auth/Signup'));
const ShopsList = lazy(() => import('./pages/ShopsList'));
const ShopDetails = lazy(() => import('./pages/ShopDetails'));
const ShopLanding = lazy(() => import('./pages/Shop/ShopLanding'));
const ShopLogin = lazy(() => import('./pages/Shop/Auth/ShopLogin'));
const ShopRegister = lazy(() => import('./pages/Shop/Auth/ShopRegister'));
const ShopOnboarding = lazy(() => import('./pages/Shop/ShopOnboarding'));
const About = lazy(() => import('./pages/About'));
const Safety = lazy(() => import('./pages/Safety'));
const Guidelines = lazy(() => import('./pages/Guidelines'));
const Support = lazy(() => import('./pages/Support'));

// Protected Pages
const Onboarding = lazy(() => import('./pages/Onboarding'));
const AddPet = lazy(() => import('./pages/AddPet'));
const MatchFeed = lazy(() => import('./pages/MatchFeed'));
const Explore = lazy(() => import('./pages/Explore'));
const PetProfile = lazy(() => import('./pages/PetProfile'));
const Messages = lazy(() => import('./pages/Messages'));
const ChatRoom = lazy(() => import('./pages/ChatRoom'));
const ChatSettings = lazy(() => import('./pages/ChatSettings'));
const Profile = lazy(() => import('./pages/Profile'));

// Shop Portal
const ShopLayout = lazy(() => import('./components/ShopLayout'));
const ShopDashboard = lazy(() => import('./pages/Shop/ShopDashboard'));
const ShopSchedule = lazy(() => import('./pages/Shop/ShopSchedule'));
const ShopServices = lazy(() => import('./pages/Shop/ShopServices'));
const ShopBookings = lazy(() => import('./pages/Shop/ShopBookings'));
const ShopSettings = lazy(() => import('./pages/Shop/ShopSettings'));

// Admin Portal
const AdminLayout = lazy(() => import('./components/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'));
const AdminShops = lazy(() => import('./pages/Admin/AdminShops'));
const AdminUsers = lazy(() => import('./pages/Admin/AdminUsers'));
const AdminBookings = lazy(() => import('./pages/Admin/AdminBookings'));
const AdminPets = lazy(() => import('./pages/Admin/AdminPets'));
const AdminReports = lazy(() => import('./pages/Admin/AdminReports'));
const AdminAnalytics = lazy(() => import('./pages/Admin/AdminAnalytics'));
const AdminFeedback = lazy(() => import('./pages/Admin/AdminFeedback')); // Add AdminFeedback Import
const ShopSignup = lazy(() => import('./pages/Shop/Auth/ShopSignup'));

// Loading Fallback
const LoadingFallback = () => (
  <div style={{ height: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <CircleNotch size={48} className="animate-spin" color="var(--primary-500)" />
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .animate-spin { animation: spin 1s linear infinite; }`}</style>
  </div>
);

// Reuse MessagesPlaceholder but need to import it or inline it if it's not default export
// It is named export. We can keep standard import for small components or lazy load it too.
// For now, let's keep named imports that are small standard, or lazy load if large.
// The previous code had: import Messages, { MessagesPlaceholder } from './pages/Messages';
// Since Messages is default export, we laziness handles default.
// For named export, we can do: const MessagesPlaceholder = lazy(() => import('./pages/Messages').then(module => ({ default: module.MessagesPlaceholder })));
// OR just keep it standard if it's small.
// Let's lazy load the main Page components.
// We need to re-import MessagesPlaceholder properly or redefine it.
// The file has `export const MessagesPlaceholder`.
// Let's do a trick: we will keep the explicit import for the placeholder since it's used in sub-route.
// ACTUALLY, mixing lazy and static imports for same file might be weird.
// Better strategy: Lazy load the DEFAULT export `Messages` as `MessagesPage`.
// And lazy load the placeholder:
const MessagesPlaceholder = lazy(() => import('./pages/Messages').then(module => ({ default: module.MessagesPlaceholder })));

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
                <Suspense fallback={<LoadingFallback />}>
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
                        <Route path="/explore" element={<Explore />} />
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
                      <Route path="users" element={<AdminUsers />} />
                      <Route path="bookings" element={<AdminBookings />} />
                      <Route path="pets" element={<AdminPets />} />
                      <Route path="reports" element={<AdminReports />} />
                      <Route path="reports" element={<AdminReports />} />
                      <Route path="analytics" element={<AdminAnalytics />} />
                      <Route path="feedback" element={<AdminFeedback />} /> {/* Add Route */}
                    </Route>

                    {/* Shop Auth Routes */}
                    <Route path="/shop/signup" element={<ShopSignup />} />

                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </div>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
