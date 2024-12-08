import fetch from 'node-fetch';
import PhishtankData from '../models/phishtankModel.js';

export const savePhishtankData = async (req, res) => {
    try {
        console.log('Fetching Phishtank data...');
        
        // Initial fetch to get the redirect URL
        const initialResponse = await fetch('https://data.phishtank.com/data/online-valid.json', {
            redirect: 'manual', // Handle redirection manually
            headers: {
                'User-Agent': 'phishtank/your-username', // Replace with your actual username
            },
        });

        if (initialResponse.status === 429) {
            const retryAfter = initialResponse.headers.get('Retry-After') || 60; // Default to 60 seconds
            console.log(`Rate-limited. Retrying in ${retryAfter} seconds...`);
            setTimeout(() => savePhishtankData(req, res), retryAfter * 1000);
            return;
        }

        if (initialResponse.status !== 301 && initialResponse.status !== 302) {
            throw new Error(`Unexpected response status: ${initialResponse.status}`);
        }

        const redirectedUrl = initialResponse.headers.get('location');
        console.log('Redirected URL:', redirectedUrl);

        // Fetch the data from the redirected URL
        const finalResponse = await fetch(redirectedUrl, {
            headers: {
                'User-Agent': 'phishtank/your-username', // Replace with your actual username
            },
        });

        if (finalResponse.status === 429) {
            const retryAfter = finalResponse.headers.get('Retry-After') || 60;
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
    } catch (error) {
        console.error('Error saving Phishtank data:', error.message);
        res.status(500).json({ message: 'Error fetching or saving Phishtank data.' });
    }
};
