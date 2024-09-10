const TryCatch = (handler) => {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      console.error(`Error occurred in ${handler.name}:`, error); // Log detailed error for debugging

      res.status(error.statusCode || 500).json({
        message: error.message || 'Internal Server Error',
      });
    }
  };
};

export default TryCatch;
