import jwt from "jsonwebtoken"

const dashboardAdminMiddleware = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        if (req.user.isDashboardAdmin) {
            next();
        } else {
            return res.status(403).json({ error: "Access denied. Admins only." });
        }
    } catch (error) {
        res.status(400).json({ error: "Invalid token." });
    }
}
export default dashboardAdminMiddleware;