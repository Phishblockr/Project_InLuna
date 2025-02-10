import asyncHandler from "../middlewares/asyncHandler.js";
import UrlhausData from "../models/urlhausModel.js";


//Api all data = http://localhost:5000/api/urlhaus/getAll
//Api limit data = http://localhost:5000/api/urlhaus/getAll?limit=500
//Api filter data = http://localhost:5000/api/urlhaus/getAll?threat=malware_download
export const getAllUrlhausData = async (req, res) => {
    try {
        console.log("Fetching stored URLhaus data...");

        // Extract optional query parameters
        const { threat, url_status, limit } = req.query;

        let filter = {};
        if (threat) filter.threat = threat; // Filter by threat type
        if (url_status) filter.url_status = url_status; // Filter by URL status

        // If limit is provided, use it, else return all records (default behavior)
        const maxLimit = 1000;
        const queryLimit = limit ? Math.min(parseInt(limit), maxLimit) : 0; // 0 = No limit (fetch all)

        // Fetch filtered data from MongoDB
        const urlhausRecords = queryLimit
            ? await UrlhausData.find(filter).limit(queryLimit)
            : await UrlhausData.find(filter); // Fetch all records if no limit

        if (!urlhausRecords.length) {
            return res.status(404).json({ message: "No URLhaus records found." });
        }

        console.log(`Fetched ${urlhausRecords.length} records.`);
        res.status(200).json(urlhausRecords);
    } catch (error) {
        console.error("Error retrieving URLhaus data:", error.message);
        res.status(500).json({ message: "Error retrieving URLhaus data." });
    }
};

export const saveUrlhausData = async (req, res) => {
    try {
        console.log("Fetching recent malware URLs from URLhaus...");

        // Fetch recent malware URLs
        const response = await fetch("https://urlhaus-api.abuse.ch/v1/urls/recent/", {
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Error fetching data: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();

        // Check if query returned results
        if (data.query_status !== "ok" || !data.urls || data.urls.length === 0) {
            console.log("No new malware URLs found.");
            return res.status(200).json({ message: "No new records found." });
        }

        console.log(`Fetched ${data.urls.length} malware records. Processing...`);
        let newEntries = 0;

        for (const record of data.urls) {
            const updated = await UrlhausData.updateOne(
                { id: record.id }, // Unique ID from URLhaus
                { $set: record }, // Store/update record
                { upsert: true } // Insert if not found
            );

            if (updated.upsertedCount > 0) {
                newEntries++;
            }
        }

        console.log(`Processing completed: ${newEntries} new records added.`);
        res.status(200).json({
            message: `${newEntries} new records added.`,
        });

    } catch (error) {
        console.error("Error saving Urlhaus data:", error.message);
        res.status(500).json({ message: "Error fetching or saving the Urlhaus data." });
    }
};

export const logMalwareVisit = async(req,res)=>{
    try {
        const { userId, url } = req.body;

        if (!userId || !url) {
            return res.status(400).json({ message: "User ID and URL are required." });
        }

        // Normalize the URL
        const normalizedUrl = new URL(url).href;

        let existingUrl = await UrlhausData.findOne({ url: normalizedUrl });

        if (existingUrl) {
            // Check if user has already visited
            let visitor = existingUrl.visitedBy.find(v => v.userId.equals(userId));
            if (visitor) {
                visitor.visits.push({ timestamp: new Date() });
                visitor.totalVisits += 1;
            } else {
                existingUrl.visitedBy.push({
                    userId,
                    visits: [{ timestamp: new Date() }],
                    totalVisits: 1
                });
            }
            await existingUrl.save();
            return res.status(200).json({ message: "Visit recorded", data: existingUrl });
        } else {
            // Create a new entry
            const newUrlEntry = new UrlhausData({
                url: normalizedUrl,
                visitedBy: [{
                    userId,
                    visits: [{ timestamp: new Date() }],
                    totalVisits: 1
                }]
            });

            await newUrlEntry.save();
            return res.status(201).json({ message: "New entry created and visit logged", data: newUrlEntry });
        }
    } catch (error) {
        console.error("Error logging visit:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export const fetchUrl = asyncHandler(async(req,res)=>{
    try {
        const { url } = req.body;
        // const normalizedUrl = new URL(url).href;
        const urlData = await UrlhausData.findOne({url:url});
        if(!urlData){
            res.status(404).json({error:"Url Does not exists in db."});
        }else{
            res.status(200).json({urlData});
        }

        
    } catch (error) {
        return res.status(500).json({error : error.message})
    }
})

export const addMalwareUrl = asyncHandler(async (req, res) => {
    try {
        const {id, url, threat, blacklists, urlhaus_reference, host, date_added, reporter, larted, tag } = req.body;

        if (!url || !threat) {
            return res.status(400).json({ message: "URL and threat type are required." });
        }

        // Normalize URL to avoid duplicates
        const normalizedUrl = url.trim().toLowerCase();

        // Check if URL already exists
        const existingUrl = await UrlhausData.findOne({ url: normalizedUrl });

        if (existingUrl) {
            return res.status(409).json({ message: "URL already exists in the database.", data: existingUrl });
        }

        // Create new entry
        const newMalwareUrl = new UrlhausData({
            id: id, 
            url: normalizedUrl,
            threat,
            blacklists: blacklists || {}, // Default empty object if no blacklists provided
            urlhaus_reference: urlhaus_reference || null,
            host: host || null,
            date_added: date_added || new Date().toISOString(), // Use current timestamp if not provided
            reporter: reporter || "anonymous",
            larted: larted || "false",
            tag: tag || [],
        });

        await newMalwareUrl.save();

        return res.status(201).json({ message: "Malware URL added successfully.", data: newMalwareUrl });

    } catch (error) {
        console.error("❌ Error Adding URL:", error);
        return res.status(500).json({ error: error.message, message: "Error Adding URL" });
    }
});