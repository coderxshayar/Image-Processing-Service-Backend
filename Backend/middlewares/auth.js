const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Get token from the Authorization header (format: 'Bearer <token>')
    const token = req.header('Authorization')?.split(' ')[1];
    
    // Check if token exists
    if (!token) {
        return res.status(401).send('Access Denied: No token provided');
    }

    try {
        // Verify the token using the JWT secret
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach user data (from token) to the request object
        req.user = decoded;
        console.log(decoded);
        // Proceed to the next middleware or route handler
        next();
    } catch (error) {
        // Token verification failed
        console.log(req.body);
        res.status(400).send('Invalid Token');
    }
};

module.exports = authMiddleware;
