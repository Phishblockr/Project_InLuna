import mongoose from 'mongoose';
import { getDb } from '../admindb.js';

const detailSchema = new mongoose.Schema({
    ip_address: { type: String, required: true },
    cidr_block: { type: String },
    announcing_network: { type: String },
    rir: { type: String },
    country: { type: String },
    detail_time: { type: Date },
});

const phishtankSchema = new mongoose.Schema({
    phish_id: { type: Number, required: true, unique: true },
    url: { type: String, required: true },
    phish_detail_url: { type: String },
    submission_time: { type: Date },
    verified: { type: String, enum: ['yes', 'no'], default: 'no' },
    verification_time: { type: Date },
    online: { type: String, enum: ['yes', 'no'], default: 'yes' },
    details: [detailSchema], // Array of details based on the provided structure
    target: { type: String, default: 'Unknown' },
}, { timestamps: true }); // Automatically add createdAt and updatedAt timestamps

// const PhishtankData = mongoose.model('phishtankData', phishtankSchema);

// export default PhishtankData;

export const getPhishtankModel = async () => {
    const adminDb = await getDb();
    return (
        adminDb.models.phishtankData ||
        adminDb.model("phishtankData", phishtankSchema)
    );
};

