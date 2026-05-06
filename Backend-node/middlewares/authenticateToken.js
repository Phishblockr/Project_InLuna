import jwt from "jsonwebtoken";

const authenticateToken = (req, res, next) => {
  // First, try to get the token from cookies
  const tokenFromCookie = req.cookies?.authToken;
  // If not found in cookies, try the Authorization header
  const authHeader = req.headers["authorization"];
  const tokenFromHeader = authHeader && authHeader.split(" ")[1];

  // Use the token from cookies first, fallback to the Authorization header
  const token = tokenFromCookie || tokenFromHeader;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Forbidden: Invalid token" });

    req.user = user; // Attach the user object to the request
    next();
  });
};

export default authenticateToken;
