import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Clock, FileText, Calendar, ChevronRight, Mail, Shield } from 'lucide-react';

const Home = () => {
    return (
        <div className="landing-page">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-background">
                    <div className="hero-shape shape-1"></div>
                    <div className="hero-shape shape-2"></div>
                </div>
                <div className="hero-container">
                    <div className="hero-content">
                        <div className="hero-logo">
                            <Building2 size={48} />
                        </div>
                        <h1>GDEA Engineering Portal</h1>
                        <p className="hero-subtitle">
                            Internal project task management and cost reporting system.
                        </p>
                        <div className="hero-actions">
                            <Link to="/register" className="btn btn-outline btn-lg">
                                Get Started
                            </Link>
                            <Link to="/login" className="btn btn-white btn-lg">
                                Login
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Links Section */}
            <section className="section services-section">
                <div className="landing-container">
                    <div className="section-header">
                        <h2>Quick Access</h2>
                        <p>Navigate to key features of the portal</p>
                    </div>
                    <div className="services-grid">
                        <Link to="/login" className="service-card">
                            <div className="service-icon">
                                <Clock size={28} />
                            </div>
                            <div className="service-content">
                                <h3>Timesheet Entry</h3>
                                <p>Log daily work hours and project tasks for accurate cost tracking.</p>
                            </div>
                            <ChevronRight size={20} className="service-arrow" />
                        </Link>
                        <Link to="/login" className="service-card">
                            <div className="service-icon">
                                <FileText size={28} />
                            </div>
                            <div className="service-content">
                                <h3>Project Reports</h3>
                                <p>Access project status reports, cost summaries, and performance metrics.</p>
                            </div>
                            <ChevronRight size={20} className="service-arrow" />
                        </Link>
                        <Link to="/login" className="service-card">
                            <div className="service-icon">
                                <Calendar size={28} />
                            </div>
                            <div className="service-content">
                                <h3>Project Schedule</h3>
                                <p>View project timelines, milestones, and team assignments.</p>
                            </div>
                            <ChevronRight size={20} className="service-arrow" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section className="section about-section">
                <div className="landing-container">
                    <div className="about-grid">
                        <div className="about-content">
                            <h2>About the Portal</h2>
                            <p>
                                The GDEA Engineering Portal is our internal system for managing engineering projects,
                                tracking employee work hours, and reporting project costs.
                            </p>
                            <p>
                                All employees are required to log their daily tasks through this system.
                                Managers can monitor project progress and team productivity through the admin dashboard.
                            </p>
                        </div>
                        <div className="about-features">
                            <div className="feature-item">
                                <div className="feature-check">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </div>
                                <span>Secure internal access</span>
                            </div>
                            <div className="feature-item">
                                <div className="feature-check">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </div>
                                <span>Real-time project tracking</span>
                            </div>
                            <div className="feature-item">
                                <div className="feature-check">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </div>
                                <span>Cost reporting & analytics</span>
                            </div>
                            <div className="feature-item">
                                <div className="feature-check">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </div>
                                <span>Team collaboration tools</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section className="section contact-section">
                <div className="landing-container">
                    <div className="contact-card">
                        <h2>Need Help?</h2>
                        <p>Contact admin for access requests or system support.</p>
                        <div className="contact-links">
                            <a href="mailto:it-support@gdea.com" className="contact-link">
                                <Mail size={18} />
                                <span>IT Support</span>
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
