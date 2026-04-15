function errorHandler(err, req, res, next) {
  const isDev = process.env.NODE_ENV === 'development';

  // Determine appropriate HTTP status
  let status = err.status || err.statusCode || 500;

  // CORS errors should be 403, not 500
  if (err.message && err.message.toLowerCase().includes('cors')) {
    status = 403;
  }

  if (status >= 500) {
    console.error('Server error:', err);
  }

  // Return JSON for API routes or XHR requests
  const isApiRequest = req.xhr ||
    req.headers.accept?.includes('application/json') ||
    req.path.startsWith('/api/') ||
    req.path.startsWith('/auth/') ||
    req.path.startsWith('/admin/api/');

  if (isApiRequest) {
    return res.status(status).json({
      error: (isDev || status < 500) ? err.message : 'An error occurred',
    });
  }

  // HTML error page for browser requests
  res.status(status).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head><title>Error ${status}</title>
    <style>body{font-family:sans-serif;max-width:600px;margin:50px auto;padding:20px;color:#333}
    h1{color:#c00}</style></head>
    <body>
      <h1>Error ${status}</h1>
      <p>${isDev ? err.message : 'Something went wrong.'}</p>
      <a href="/">← Back to Home</a>
    </body>
    </html>
  `);
}

module.exports = { errorHandler };
