// wrapper for async middleware. Eliminates need to catch errors.

// This function takes a handler(an async middleware) as an argument.
// returns a new middleware.
// When called the returned middleware:
  // Invoke the original handler.
  // Creates a "resolved Promise" that has the value returned by the original handler function
  // if the handler function raises an exception, the exception gets caught by the
  // 'Promise.prototype.catch' cal, which in turn dispatch the error via 'next(error)'
const catchError = handler => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  }
}

module.exports = catchError;