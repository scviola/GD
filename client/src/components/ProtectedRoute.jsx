//prevent employees from accessing admin pages
import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.js';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user } = useContext(AuthContext);

    if (!user) 
        return <Navigate to="/login" replace />;

    if (!allowedRoles.includes(user.role)) 
        return <Navigate to="/unauthorized" replace />;

    return <Outlet />;
};

export default ProtectedRoute;