const globalErrorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let status = err.status || 'error';
    let message = err.message || "Internal server error";

    // Specific Mongo error - duplicate key
    if (err.code === 11000) {
        return res.status(409).json({ 
        status: 'fail', 
        message: `Duplicate value for ${Object.keys(err.keyValue)}. Please use another value.` 
        });
    }

    // Invalid MongoDB ObjectId
    if (err.name === "CastError") {
        statusCode = 400;
        message = "Invalid ID format";
    }

    // Mongoose validation error
    if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors).map(e => e.message).join(", ");
    }

    res.status(statusCode).json({
        success: false, 
        status, 
        message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};


module.exports = globalErrorHandler;