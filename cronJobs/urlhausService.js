import cron from 'node-cron';
import fetch from 'node-fetch';
import UrlhausData from '../models/urlhausModel.js';


const fetchAndSaveUrlhausData = async () => {
    try {
        console.log('Fetching recent malware URLs from URLhaus...');

        // Fetch recent malware URLs
        const response = await fetch('https://urlhaus-api.abuse.ch/v1/urls/recent/', {
            headers: {
                // TODO :- change the Auth key to inluna's abuse auth key
                'Auth-Key': "b493ba268c46939b9e833a36baf8264d93028760172c0025" 
            }
        });

        if (!response.ok) {
            throw new Error(`Error fetching data: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();

        // Check if query returned results
        if (data.query_status !== "ok" || !data.urls || data.urls.length === 0) {
            console.log("No new malware URLs found.");
            return;
        }

        console.log(`Fetched ${data.urls.length} malware records. Processing...`);
        let newEntries = 0;

        for (const record of data.urls) {
            const query = { id: record.id }; // Unique identifier from URLhaus
            const update = { $set: record }; // Store/update record
            const options = { upsert: true }; // Insert if not found

            const result = await UrlhausData.updateOne(query, update, options);

            if (result.upsertedCount > 0) {
                newEntries++; // Count new entries
            }
        }

        console.log(`Processing completed: ${newEntries} new entries added.`);
    } catch (error) {
        console.error('❌ Error fetching or saving URLhaus data:', error.message);
    }
};

// Schedule the job to run every midnight
cron.schedule('0 0 * * *', () => {
    console.log('Running scheduled URLhaus job...');
    fetchAndSaveUrlhausData();
});

export default fetchAndSaveUrlhausData;
