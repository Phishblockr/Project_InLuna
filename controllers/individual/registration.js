import asyncHandler from "../../middlewares/asyncHandler.js";
import { getIndividualUserModel } from "../../models/individualUserModel.js";
import { generateUsername } from "../../utils/generateUsername.js"
import bcrypt from 'bcryptjs';
import { sendOnboardingIndividualUsrEmail } from "../../utils/sendOnboardingIndividualUsrEmail.js";

export const createindividualUser = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email, and password are required." });
    }

    const User = await getIndividualUserModel();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists." });
    }

    const username = generateUsername(email, 0)

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(password)){
        return res.status(400).json({ error: "Password must be at least 6 characters long and contain both letters and numbers." });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User ({
        username,
        name,
        email,
        role,
        password: hashedPassword,
        userType: process.env.INDIVIDUAL
    });

    const addedUser = await newUser.save();

    sendOnboardingIndividualUsrEmail(addedUser.email, "Welcom to Inluna 🙏🏻", addedUser);

    res.status(201).json({ message: "Individual user created successfully", user: addedUser });
});