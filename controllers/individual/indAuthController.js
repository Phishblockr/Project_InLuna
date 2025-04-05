import asyncHandler from "../../middlewares/asyncHandler.js";
import { getIndividualUserModel } from "../../models/individualModels/individualUserModel.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const loginIndUser = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "username and password are required." });
    }

    const User = await getIndividualUserModel();
    const user = await User.findOne({ username });

    if (!user) {
        return res.status(400).json({ message: "Invalid credentails." })
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentails" })
    }

    const payload = {
        userId: user._id,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { algorithm: "HS256", expiresIn: "1h" });
    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET_REFRESH, { algorithm: "HS256", expiresIn: "30d" })

    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({ token, refreshToken })
});

export const IndRefreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token is required" })
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET_REFRESH);

    const { userId } = decoded

    if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
    }

    const User = await getIndividualUserModel();
    const user = await User.findById(userId);

    if (!user || user.refreshToken !== refreshToken) {
        return res.status(403).json({ message: "Invalid refresh token." });
    }

    const payload = { userId: user._id };
    const newToken = jwt.sign(payload, process.env.JWT_SECRET, { algorithm: "HS256", expiresIn: "1h" });
    const newRefreshToken = jwt.sign(payload, process.env.JWT_SECRET_REFRESH, { algorithm: "HS256", expiresIn: "30d" });

    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({ token: newToken, refreshToken: newRefreshToken })
});

export const logoutIndUser = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token is required" })
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET_REFRESH);

    const { userId } = decoded

    if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
    }

    const User = await getIndividualUserModel();
    const user = await User.findById(userId);

    user.refreshToken = null;
    await user.save();

    res.status(200).json({ message: "User logged out successfully" });
})

export const findAccount = async (ctx, id) => {
    const User = await getIndividualUserModel();
  
    let user;
    try {
      // Convert the id to a MongoDB ObjectId (if it isn't already) and query
      user = await User.findById(new mongoose.Types.ObjectId(id));
    } catch (err) {
      console.error("findAccount error:", err);
      return undefined;
    }
    
    if (!user) return undefined;
    
    // Return an object with the accountId and a claims function.
    return {
      accountId: id,
      async claims(use, scope) {
        // Return a claims object. You can customize which claims are returned
        return {
          sub: id,
          name: user.name,
          email: user.email,
          // Add additional claims as needed
        };
      }
    };
  };
  