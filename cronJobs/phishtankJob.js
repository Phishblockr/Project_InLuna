import cron from 'node-cron';
import fetch from 'node-fetch';
import PhishtankData from '../models/phishtankModel.js';

const fetchAndSavePhishtankData = async () => {
    try {
        console.log('Fetching Phishtank data...');
        
        // Initial fetch to get the redirect URL
        const initialResponse = await fetch('https://data.phishtank.com/data/online-valid.json', {
            redirect: 'manual',
            headers: {
                'User-Agent': 'phishtank/username', // Replace with your actual username
            },
        });

        if (initialResponse.status === 429) {
            const retryAfter = initialResponse.headers.get('Retry-After') || 60;
            console.log(`Rate-limited. Retrying in ${retryAfter} seconds...`);
            setTimeout(fetchAndSavePhishtankData, retryAfter * 1000);
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
                'User-Agent': 'phishtank/username',
            },
        });

        if (finalResponse.status === 429) {
            const retryAfter = finalResponse.headers.get('Retry-After') || 60;
            console.log(`Rate-limited. Retrying in ${retryAfter} seconds...`);
            setTimeout(fetchAndSavePhishtankData, retryAfter * 1000);
            return;
        }

        if (!finalResponse.ok) {
            throw new Error(`Error fetching data from redirected URL: ${finalResponse.status}`);
        }

        const data = await finalResponse.json();

        console.log(`Fetched ${data.length} records. Processing...`);
        let newEntries = 0;

        for (const record of data) {
            const query = { phish_id: record.phish_id, url: record.url }; // Match on both phish_id and url
            const update = { $set: record }; // Update with the latest record data
            const options = { upsert: true }; // Insert if not found

            const result = await PhishtankData.updateOne(query, update, options);

            if (result.upsertedCount > 0) {
                newEntries++; // Count only newly added entries
            }
        }

        console.log(`Processing completed: ${newEntries} new entries added.`);
    } catch (error) {
        console.error('Error fetching or saving Phishtank data:', error.message);
    }
};

// Schedule the job to run less frequently
cron.schedule('0 0 * * *', () => { // Every day at mid night
    console.log('Running scheduled Phishtank job...');
    fetchAndSavePhishtankData();
});

export default fetchAndSavePhishtankData;
