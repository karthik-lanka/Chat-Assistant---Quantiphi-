/**
 * Centralized error handling middleware.
 * Formats errors into clean JSON responses and never leaks stack traces or credentials.
 */
export const errorHandler = (err, req, res, next) => {
  // If streaming headers were already sent, delegate to express default handler
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle Mongoose specific validation / cast errors
  if (err.name === 'CastError' || err.name === 'ValidationError') {
    statusCode = 400;
  }

  // Log error without leaking sensitive headers or keys
  console.error(`[Error Handler] ${req.method} ${req.originalUrl} - Status: ${statusCode} - ${message}`);

  res.status(statusCode).json({
    error: message,
  });
};

export default errorHandler;
