import asyncHandler from "../../middlewares/asyncHandler.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateUsername } from "../../utils/generateUsername.js";
import { getSuperAdminModel } from "../../models/superAdmin/superAdminModel.js";

// Create Super Admin (Only first-time setup)
export const createSuperAdmin = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields are required." });
    }

    try {
        const SuperAdmin = await getSuperAdminModel();

        // Check if Super Admin already exists
        const existingAdmin = await SuperAdmin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: "Super Admin already exists." });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const phone = "1234"
        const username = generateUsername(email, phone);
        // Create Super Admin
        const newAdmin = new SuperAdmin({ name, username, email, password: hashedPassword });
        await newAdmin.save();

        res.status(201).json({ message: "Super Admin created successfully." });
    } catch (error) {
        console.error("Error creating Super Admin:", error);
        res.status(500).json({ message: "Server error" });
    }
});

export const fetchProfileSuperAdmin = asyncHandler(async (req, res) => {
    try {
      const { userId } = req.user; // For super admin, we don't need orgId
  
      // Get the SuperAdmin model from adminDB
      const SuperAdmin = await getSuperAdminModel();
  
      // Find the super admin by ID and select only relevant fields
      const user = await SuperAdmin.findById(userId).select("name email role createdAt");
  
      if (!user) {
        return res.status(404).json({ error: "Super Admin not found." });
      }
  
      res.json(user);
    } catch (error) {
      console.error("Error fetching super admin profile:", error);
      res.status(500).json({ error: "Server error" });
    }
  });
  

// DEMO CODE NOT IN USE for login refer code in authenticationController.js

export const loginSuperAdm = asyncHandler(async (req, res) => {
    const { username, password, rememberMe } = req.body;

    if (!username || !password) {
        res.status(400);
        throw new Error("Username and password are required.");
    }

    // Configure secure cookie options
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    };
    if (rememberMe) {
        cookieOptions.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    }

    // Retrieve the SuperAdmin model from admindb
    const SuperAdmin = await getSuperAdminModel();

    // Find the super admin – adjust the query field if needed (e.g., using email)
    const user = await SuperAdmin.findOne({ username });
    if (!user) {
        res.status(404);
        throw new Error("Invalid credentials.");
    }

    // Validate the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        res.status(401);
        throw new Error("Invalid credentials.");
    }

    // Generate JWT tokens
    const payload = {
        userId: user.id,
        userType: "superadmin",
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        algorithm: "HS256",
        expiresIn: "1h",
    });
    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET_REFRESH, {
        algorithm: "HS256",
        expiresIn: rememberMe ? "7d" : "1d",
    });

    // Encrypt and store the refresh token
    const encryptedRefreshToken = await encrypt(refreshToken);
    user.refreshToken = encryptedRefreshToken;
    await user.save();

    // Set refresh token in a secure cookie
    res.cookie("refreshToken", encryptedRefreshToken, cookieOptions);

    res.status(200).json({
        token,
        message: "Super Admin logged in successfully.",
    });
});

export const getAllSuperAdminLogs = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const operationType = req.query.operationType || "all";
    const dateRangeFilter = req.query.dateRangeFilter || "all";

    try {
        // Super Admin: Fetch all logs across tenants
        const logs = await AdminLogs.aggregate([
            { $match: { ...getDateRange(dateRangeFilter) } },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            { $unwind: "$userDetails" },
            {
                $match: search ? {
                    $or: [
                        { operationsPerformed: { $regex: search, $options: "i" } },
                        { "userDetails.name": { $regex: search, $options: "i" } }
                    ]
                } : {}
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        ]);

        // Count total logs
        const totalLogs = await AdminLogs.countDocuments({});

        // Fetch entity details for each log entry
        const logsWithDetails = await Promise.all(
            logs.map(async (log) => ({
                ...log,
                entityDetails: log.entityDetails || await getEntityDetails(log.entityType, log.entityId)
            }))
        );

        res.json({
            data: logsWithDetails,
            currentPage: page,
            totalPages: Math.ceil(totalLogs / limit),
            totalLogs
        });
    } catch (error) {
        console.error("Error fetching Super Admin logs:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

export const exportSuperAdminLogsToCsv = asyncHandler(async (req, res) => {
    try {
        // Fetch logs for all tenants
        const logs = await AdminLogs.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            { $unwind: "$userDetails" },
            {
                $project: {
                    _id: 1,
                    operationType: 1,
                    operationsPerformed: 1,
                    createdAt: 1,
                    entityId: 1,
                    entityType: 1,
                    entityDetails: 1,
                    orgId: 1,
                    "userDetails.name": 1,
                    "userDetails.email": 1,
                    "userDetails.department": 1
                }
            },
            { $sort: { createdAt: -1 } }
        ]);

        if (!logs.length) {
            return res.status(404).json({ message: "No logs found for any tenant" });
        }

        // CSV Fields
        const fields = [
            { label: "Log ID", value: "_id" },
            { label: "Organization ID", value: "orgId" },
            { label: "Operation Type", value: "operationType" },
            { label: "Operations Performed", value: "operationsPerformed" },
            { label: "Created At", value: "createdAt" },
            { label: "Entity ID", value: "entityId" },
            { label: "Entity Type", value: "entityType" },
            { label: "Entity Details", value: (row) => JSON.stringify(row.entityDetails) || "NA" },
            { label: "User Name", value: "userDetails.name" },
            { label: "User Email", value: "userDetails.email" },
            { label: "User Department", value: "userDetails.department" }
        ];

        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(logs);

        // Save file temporarily
        const filePath = path.join(__dirname, "..", "exports", `superadmin_logs_${Date.now()}.csv`);
        fs.writeFileSync(filePath, csv);

        res.download(filePath, `superadmin_logs_${Date.now()}.csv`, (err) => {
            if (err) {
                console.error("Error downloading the CSV file:", err);
                return res.status(500).json({ message: "Error downloading the CSV file" });
            }

            // Delete file after download
            setTimeout(() => fs.unlinkSync(filePath), 5000);
        });

    } catch (error) {
        console.error("Error exporting logs to CSV:", error);
        res.status(500).json({ message: "Error exporting logs to CSV", error: error.message });
    }
});

const getDateRange = (filter) => {
    const today = new Date();

    switch (filter) {
        case "this_week":
            return { createdAt: { $gte: startOfWeek(today), $lte: endOfWeek(today) } };
        case "last_week":
            return { createdAt: { $gte: startOfWeek(subWeeks(today, 1)), $lte: endOfWeek(subWeeks(today, 1)) } };
        case "this_month":
            return { createdAt: { $gte: startOfMonth(today), $lte: endOfMonth(today) } };
        case "last_month":
            return { createdAt: { $gte: startOfMonth(subMonths(today, 1)), $lte: endOfMonth(subMonths(today, 1)) } };
        case "this_quarter":
            return { createdAt: { $gte: startOfQuarter(today), $lte: endOfQuarter(today) } };
        case "last_quarter":
            return { createdAt: { $gte: startOfQuarter(subQuarters(today, 1)), $lte: endOfQuarter(subQuarters(today, 1)) } };
        case "this_year":
            return { createdAt: { $gte: startOfYear(today), $lte: endOfYear(today) } };
        case "last_year":
            return { createdAt: { $gte: startOfYear(subYears(today, 1)), $lte: endOfYear(subYears(today, 1)) } };
        default:
            return {}; // No date filter for 'all'
    }
};
