import mongoose from "mongoose";

const domainReputationSchema = new mongoose.Schema(
    {
        urlDomain:{
            type: String,
            required:[true, "Url cannot be empty"]
        },
        reputationDetails:{
            type:Object,
            default:null,
        },
        reputationScore:{
            type: Number,
            default:0,
        },
    },
    {timestamps: true}
);

domainReputationSchema.index({createdAt: 1});

const domainReputation = mongoose.model("DomainReputation", domainReputationSchema);

export default domainReputation;