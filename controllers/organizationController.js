import { getOrgModel } from '../models/organisationModel.js';
import winston from 'winston';
import { getTenantDB, getUserModel } from '../tenantdb.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import { generateUniqueOrgId } from '../utils/generateOrgId.js';
import { sendOnboardingEmail } from '../utils/sendOnboardingEmail.js';
import heartbeatSchema from '../models/heartBeatModel.js';
import adminLogsSchema from '../models/adminlogsModel.js';
import bcrypt from 'bcryptjs';
import { generateUsername } from '../utils/generateUsername.js';
import { generatePasswordSetupLink } from '../utils/generatePasswordSetupLink.js';
import { sendPasswordSetupEmail } from '../utils/sendPasswordSetupEmail.js';


// Logger setup
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'error.log', level: 'error' })
    ]
});

// Get all organizations
export const getAllOrganizations = async (req, res) => {

    try {
        const { month, year } = req.query
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;
        const search = req.query.search || "";
        const status = req.query.status || "all";

        const searchFilter = search ? {
            $or: [
                { name: { $regex: search, $options: 'i' } },
            ]
        } : {};

        const statusFilter =
            status === "all"
                ? {}
                : { status: status === "true" };

        const queryFilter = { ...searchFilter, ...statusFilter }

        const Organisation = await getOrgModel()
        const orgs = await Organisation.find(queryFilter)
            .skip(skip)
            .limit(limit)
            .exec();
        const count = await Organisation.countDocuments();

        const orgsWithAdminCount = orgs.map(org => ({
            ...org.toObject(),
            adminCount: org.adminIds ? org.adminIds.length : 0
        }));

        res.status(orgs.length > 0 ? 200 : 404).json(orgs.length > 0 ? {
            orgs: orgsWithAdminCount,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        } : { error: 'Organizations not found' });
    } catch (error) {
        logger.error(error.message);
        res.status(500).json({ error: 'Server error' });
    }
};

export const createOrganization = asyncHandler(async (req, res) => {
    try {
        const { name, adminName, totalUsers, adminEmail, adminPassword } = req.body;

        // Check for required fields (adminPassword is optional now)
        if (!name || !adminName || !totalUsers || !adminEmail) {
            return res.status(400).json({ error: "All organization and admin details are required (except password, which is optional)." });
        }

        // Determine if a password was provided
        const passwordProvided = adminPassword && adminPassword.trim().length > 0;
        let finalHashedPassword = "";

        // If a password is provided, validate and hash it
        if (passwordProvided) {
            const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
            if (!passwordRegex.test(adminPassword)) {
                return res.status(400).json({ message: "Password must be at least 6 characters long and contain both letters and numbers." });
            }
            const salt = await bcrypt.genSalt(10);
            finalHashedPassword = await bcrypt.hash(adminPassword, salt);
        } else {
            finalHashedPassword = "";
        }

        const TenantModel = await getOrgModel();

        const orgId = await generateUniqueOrgId(TenantModel);

        const existingOrg = await TenantModel.findOne({ adminEmailIds: adminEmail });
        if (existingOrg) {
            return res.status(400).json({ error: "Organization with this Email Id already exists." });
        }

        const newOrg = new TenantModel({ orgId, name, adminName, totalUsers, adminEmailIds: [adminEmail] });
        await newOrg.save();

        const tenantDb = await getTenantDB(orgId);
        if (!tenantDb) {
            return res.status(500).json({ error: "Failed to create tenant database." });
        }

        // Initialize other tenant-specific models
        if (!tenantDb.models.AdminLogs) {
            tenantDb.model("AdminLogs", adminLogsSchema);
        }
        if (!tenantDb.models.HeartBeat) {
            tenantDb.model("HeartBeat", heartbeatSchema);
        }

        // Get the tenant-specific User model (this function already registers User if needed)
        const User = await getUserModel(orgId);

        // Generate a unique username based on the email (append a random number)
        const username = generateUsername(adminEmail, 0)

        // Create the admin user
        const newAdmin = new User({
            username,
            name: adminName,
            email: adminEmail,
            password: finalHashedPassword,
            orgId,
            userType: process.env.ADMIN
        });

        const newUser = await newAdmin.save();

        // Update the organization document with the new admin's ID
        newOrg.adminIds = [newUser._id];
        newOrg.markModified('adminIds');
        newOrg.usersCount = Number(newOrg.usersCount) + 1;
        await newOrg.save();

        // If no password was provided, generate a password setup link and send an email
        if (!passwordProvided) {
            let emailContent = await generatePasswordSetupLink(newUser, orgId);
            await sendPasswordSetupEmail(adminEmail, "Welcome To InLuna 🙏🏻 - Password Setup", emailContent, newUser);
        } else {
            await sendOnboardingEmail(adminEmail, "Welcome To InLuna 🙏🏻", orgId, newUser.username);
        }

        res.status(201).json({
            message: "Organization and Admin created successfully",
            organization: newOrg,
            admin: newAdmin,
        });

    } catch (error) {
        console.error("❌ Error creating organization:", error.message);
        res.status(500).json({ error: "Server error", details: error.message });
    }
});


// Get a single organization by ID
export const getOrganization = asyncHandler(async (req, res) => {
    try {
        const { id: orgId } = req.params;

        if (!orgId) {
            return res.status(400).json({ error: "Organization ID is required." });
        }

        // ✅ Get the Admin DB model (Organizations)
        const TenantModel = await getOrgModel();

        // ✅ Find the organization in the Admin DB
        const org = await TenantModel.findOne({ orgId });

        if (!org) {
            return res.status(404).json({ error: "Organization not found." });
        }

        res.status(200).json(org);
    } catch (error) {
        console.error("❌ Error fetching organization:", error.message);
        res.status(500).json({ error: "Server error", details: error.message });
    }
});


// Delete an organization
export const deleteOrganization = asyncHandler(async (req, res) => {
    try {
        const { id: orgId } = req.params;

        if (!orgId) {
            return res.status(400).json({ error: "Organization ID is required." });
        }

        // ✅ Get the Admin DB model (Organizations)
        const TenantModel = await getOrgModel();

        // ✅ Check if the organization exists in the Admin DB
        const org = await TenantModel.findOneAndDelete({ orgId });

        if (!org) {
            return res.status(404).json({ error: "Organization not found." });
        }

        // ✅ Remove the tenant database (Disconnect & Drop)
        const tenantConnection = mongoose.connections.find(conn => conn.name === `tenant-${orgId}`);

        if (tenantConnection) {
            await tenantConnection.dropDatabase(); // Delete the tenant database
            await tenantConnection.close(); // Close the connection
        }

        res.status(200).json({ message: `Organization ${org.name} removed successfully.` });
    } catch (error) {
        console.error("❌ Error deleting organization:", error.message);
        res.status(500).json({ error: "Server error", details: error.message });
    }
});


// Update an organization
export const updateOrganization = asyncHandler(async (req, res) => {
    try {
        const { id: orgId } = req.params;

        if (!orgId) {
            return res.status(400).json({ error: "Organization ID is required." });
        }

        // ✅ Get the Admin DB model (Organizations)
        const TenantModel = await getOrgModel();

        // ✅ Update organization in the Admin DB
        const updatedOrg = await TenantModel.findOneAndUpdate(
            { orgId },
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedOrg) {
            return res.status(404).json({ error: "Organization not found." });
        }

        res.status(200).json(updatedOrg);
    } catch (error) {
        console.error("❌ Error updating organization:", error.message);

        if (error.name === "ValidationError") {
            return res.status(400).json({ error: error.message });
        }

        res.status(500).json({ error: "Server error", details: error.message });
    }
});


// Search organizations
export const searchOrganizations = asyncHandler(async (req, res) => {
    try {
        const { name, adminName, page = 1, limit = 10 } = req.query;
        const query = {};

        if (name) query.name = { $regex: name, $options: "i" };
        if (adminName) query.adminName = { $regex: adminName, $options: "i" };

        // ✅ Get the Admin DB model (Organizations)
        const TenantModel = await getOrgModel();

        // ✅ Apply pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const orgs = await TenantModel.find(query).skip(skip).limit(parseInt(limit));
        const totalOrgs = await TenantModel.countDocuments(query);

        if (!orgs.length) {
            return res.status(404).json({ error: "Organizations not found." });
        }

        res.status(200).json({
            data: orgs,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalOrgs / parseInt(limit)),
            totalOrganizations: totalOrgs,
        });
    } catch (error) {
        console.error("❌ Error searching organizations:", error.message);
        res.status(500).json({ error: "Server error", details: error.message });
    }
});


export const getOrgDetails = asyncHandler(async (req,res) => {
    const { id: orgId } = req.params;

    if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required." });
    }

    try {
        const User = await getUserModel(orgId);
        const users = await User.find({ orgId: orgId });
        
        const userDetails = await User.find({ orgId: orgId }).select('name department userType role email createdAt');

        const departments = [...new Set(users.map(user => user.department))];

        const departmentCounts = users.reduce((acc, user) => {
            acc[user.department] = (acc[user.department] || 0) + 1;
            return acc;
        }, {});
        
        const response = {
            Users: userDetails,
            Department : departments,
            UsersPerDepartment: departmentCounts,
        }

        res.status(200).send(response)
    } catch (error) {
        res.status(500).send(error.message)
    }
})