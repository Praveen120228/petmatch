import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
    children?: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Role-based Onboarding Enforcement
    if (user?.role === 'user') {
        // If profile incomplete (no username) AND not on onboarding page -> Force Onboarding
        if (!user.username && location.pathname !== '/onboarding') {
            return <Navigate to="/onboarding" replace />;
        }

        // If profile complete AND on onboarding page -> Skip to App (prevent stuck loop)
        if (user.username && location.pathname === '/onboarding') {
            return <Navigate to="/match" replace />;
        }
    }

    return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
