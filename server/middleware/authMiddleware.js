const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer "))
            return res.status(401).json({message: "Not authorized"});
        
        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded;
        
        next();
       
    } catch (error) {
        res.status(401).json({ message: 'Token failed' });
    }
};


const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Permission denied' });
        }
        
        next();
    };
};


module.exports = { protect, restrictTo };