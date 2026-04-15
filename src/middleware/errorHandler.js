function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const isDev = process.env.NODE_ENV === 'development';

  if (status >= 500) {
    console.error('Server error:', err);
  }

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(status).json({
      error: isDev ? err.message : 'An error occurred',
      ...(isDev && { stack: err.stack }),
    });
  }

  res.status(status).send(`
    <!DOCTYPE html>
    <html>
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
