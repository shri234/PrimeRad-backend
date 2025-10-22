const sessionAccessMiddleware = (req, res, next) => {
  req.userAccess = {
    isLoggedIn: !!req.user,
    isSubscribed: req.user?.subscription?.isActive || false,
    userId: req.user?._id || null,
  };
  next();
};

module.exports = sessionAccessMiddleware;
