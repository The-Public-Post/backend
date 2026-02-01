export const authorizeHouse = (...allowedHouses) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!allowedHouses.includes(req.user.house)) {
      return res.status(403).json({ error: "House access denied" });
    }

    next();
  };
};
