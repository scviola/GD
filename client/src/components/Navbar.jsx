import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Undo, Redo, MoveRight } from 'lucide-react';

const Navbar = () => {
    const { user } = useContext(AuthContext);
    const location = useLocation();

    // Check if current path is employee summaries
    const isEmployeeSummaries = location.pathname === '/employee-summaries';
    // Check if current path is task-log (task form)
    const isTaskLog = location.pathname === '/task-log';

    return (
        <nav className="navbar">
            <div className="navbar-content">
                <div className="navbar-brand">
                    <Link to="/" className="logo-link">
                        <img src="/GD-logo.png" alt="GDEA Logo" className="logo-image" />
                    </Link>
                </div>
                
                <div className="nav-links">
                    {user ? (
                        <>
                            {/* Show different links based on current page */}
                            {isEmployeeSummaries ? (
                                <>
                                    {user.role === 'admin' ? (
                                        <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        Back to Admin Dashboard
                                        <MoveRight size={20}/>
                                        </Link>
                                    ) : (
                                        <Link to="/task-log"style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Redo size={20}/>
                                            Log Task</Link>
                                    )}
                                </>
                            ) : isTaskLog ? (
                                <>
                                    <Link to="/employee-summaries" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Undo size={20} />
                                        My Summaries
                                    </Link>
                                    {user.role === 'admin' && (
                                        <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            Back to Admin Dashboard
                                            <MoveRight size={20}/>
                                        </Link>
                                    )}
                                </>
                            ) : location.pathname === '/notes' ? (
                                <>
                                    {user.role === 'admin' ? (
                                        <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            Back to Admin Dashboard
                                            <MoveRight size={20}/>
                                        </Link>
                                    ) : (
                                        <Link to="/employee-summaries" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Undo size={20} />
                                            My Summaries
                                        </Link>
                                    )}
                                </>
                            ) : null}
                            
                            {user.role === 'admin' && (
                                <>
                  
                                    {/* Show Projects when NOT on Project Manager, Task Log, Employee Summaries, or Notes page */}
                                    {location.pathname !== '/project-manager' && location.pathname !== '/task-log' && location.pathname !== '/employee-summaries' && location.pathname !== '/notes' && (
                                        <Link to="/project-manager"> Manage Projects</Link>
                                    )}
                                    {/* Show Notes link when on Admin Dashboard */}
                                    {location.pathname === '/admin' && (
                                        <Link to="/notes" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            Forum Notes
                                        </Link>
                                    )}
                                    {/* Show Master Schedule when on Project Manager page */}
                                    {location.pathname === '/project-manager' && (
                                        <Link to="/admin">Master Schedule Analytics</Link>
                                    )}
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            <Link to="/">Home</Link>
                            <Link to="/login">Login</Link>
                            
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
