import jwt from "jsonwebtoken"
import dotenv from 'dotenv';

dotenv.config();

const salesTeamAccess = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        if (req.user.userType == process.env.SUPERADM || req.user.userType == process.env.SALESTEAM) {
            next();
        } else {
            return res.status(403).json({ error: "Access denied. SuperAdmins only." });
        }
    } catch (error) {
        res.status(400).json({ error: "Invalid token." });
    }
}
export default salesTeamAccess;