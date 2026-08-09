const config = require('../config');

function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${err.message}`);
  if (config.nodeEnv === 'development') {
    console.error(err.stack);
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large' });
  }

  if (err.message === 'Only image files are allowed') {
    return res.status(400).json({ error: err.message });
  }

  if (err.code === '23505') {
    return res.status(409).json({ error: 'Resource already exists' });
  }

  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced resource not found' });
  }

  if (err.code === '22P02') {
    return res.status(400).json({ error: 'Invalid input format' });
  }

  const statusCode = err.statusCode || 500;
  const message = config.nodeEnv === 'production'
    ? 'Internal server error'
    : err.message || 'Internal server error';

  res.status(statusCode).json({ error: message });
}

function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Not found' });
}

module.exports = { errorHandler, notFoundHandler };
