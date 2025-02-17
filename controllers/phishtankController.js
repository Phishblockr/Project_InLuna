import fetch from 'node-fetch';
import { getPhishtankModel } from '../models/phishtankModel.js';
import asyncHandler from '../middlewares/asyncHandler.js';

export const savePhishtankData = asyncHandler(async (req, res) => {
    console.log("Fetching Phishtank data...");

    // Initial fetch to get the redirect URL
    const initialResponse = await fetch("https://data.phishtank.com/data/online-valid.json", {
        redirect: "manual", // Handle redirection manually
        headers: {
            "User-Agent": "phishtank/your-username", // Replace with your actual username
        },
    });

    if (initialResponse.status === 429) {
        const retryAfter = initialResponse.headers.get("Retry-After") || 60; // Default to 60 seconds
        console.log(`Rate-limited. Retrying in ${retryAfter} seconds...`);
        setTimeout(() => savePhishtankData(req, res), retryAfter * 1000);
        return;
    }

    if (initialResponse.status !== 301 && initialResponse.status !== 302) {
        throw new Error(`Unexpected response status: ${initialResponse.status}`);
    }

    const redirectedUrl = initialResponse.headers.get("location");
    console.log("Redirected URL:", redirectedUrl);

    // Fetch the data from the redirected URL
    const finalResponse = await fetch(redirectedUrl, {
        headers: {
            "User-Agent": "phishtank/your-username", // Replace with your actual username
        },
    });

    if (finalResponse.status === 429) {
        const retryAfter = finalResponse.headers.get("Retry-After") || 60;
        console.log(`Rate-limited. Retrying in ${retryAfter} seconds...`);
        setTimeout(() => savePhishtankData(req, res), retryAfter * 1000);
        return;
    }

    if (!finalResponse.ok) {
        throw new Error(`Error fetching data from redirected URL: ${finalResponse.status}`);
    }

    const data = await finalResponse.json();
    console.log(`Fetched ${data.length} records. Processing...`);
    let newEntries = 0;

    // Retrieve the Phishtank model from the adminDB
    const PhishtankData = await getPhishtankModel();

    // Process and upsert each record
    for (const record of data) {
        const updated = await PhishtankData.updateOne(
            { phish_id: record.phish_id },
            { $set: record },
            { upsert: true }
        );
        if (updated.upsertedCount > 0) {
            newEntries++;
        }
    }

    res.status(200).json({
        message: `${newEntries} new records added.`,
    });
});  
