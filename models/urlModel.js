const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema({
    url:{
        type: String,
        required : [true, 'Url cannot be empty'],
    },
    visitedBy:[{
        username: {
            type:String,
            required: [true, 'Username cannot be empty'],
        },
        visits:[{
            timestamp:{
                type: Date,
                default: Date.now,
            },
        }],
        totalVisits: {
            type: Number,
            default: 1,
        },
    }],
    isVerified:{
        type: Boolean,
        default: false,
    },
    isPhishing: {
        type: Boolean,
        default: true,
    },
    orgId: {
        type: Number,
        required: [true, 'Organization ID cannot be empty'],
    }
})
const Url  = new mongoose.model("Url", urlSchema);
module.exports = Url;