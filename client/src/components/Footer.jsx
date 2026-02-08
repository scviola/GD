import React from 'react';
import { ShieldCheck, Mail } from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear(); 

    return (
        <footer className="main-footer">
            <div className="footer-container">
                <div className="footer-left">
                    <div className="footer-brand">
                        <p>&copy; {currentYear} Gamma Delta Eastern Africa Ltd. All Rights Reserved.</p>
                    </div>
                </div>
                
                <div className="footer-right">
                    <div className="footer-links">
                        <div className="footer-link-item">
                            <ShieldCheck size={16} />
                            <span>Internal Use Only</span>
                        </div>
                        
                        <div className="footer-link-item">
                            <Mail size={16} />
                            <a href="mailto:it-support@gdea.com">System Support</a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
