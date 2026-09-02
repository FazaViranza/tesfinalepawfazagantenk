const errorHandler = (err, req, res, next) => {
  console.error('❌ Error Handler Caught:', err);

  let statusCode = Number(err.statusCode) || 500;

  if (statusCode < 400 || statusCode > 599) {
    statusCode = 500;
  }

  // Do not expose database, stack trace, or implementation details to clients.
  let message = 'Terjadi kesalahan internal pada server.';

  if (statusCode < 500 && err.message) {
    message = err.message;
  }

  if (err.code === '23505') {
    statusCode = 409;
    message = 'Data yang dimasukkan sudah digunakan.';
  }

  if (err.code === '23503') {
    statusCode = 400;
    message = 'Data terkait tidak valid atau masih digunakan.';
  }

  if (err.code === '22P02') {
    statusCode = 400;
    message = 'Format data tidak valid.';
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = {
  errorHandler,
};
