import mongoose from "mongoose";
import { getTenantDB } from "../tenantdb.js";

const urlhausSchema = new mongoose.Schema(
    {
        id:{
            type: String,
            required: true,
            unique:true,
        },
        blacklists:{
            spamhaus_dbl:String,
            surbl:String,
        },
        url:{
            type:String,
            required:true,
        },
        visitedBy: {
              type: [
                {
                  userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "user",
                  },
                  visits: [
                    {
                      timestamp: {
                        type: Date,
                        default: Date.now,
                      },
                    },
                  ],
                  totalVisits: {
                    type: Number,
                    default: 0,
                  },
                },
              ],
              default: [],
            },
        urlhaus_reference:String,
        host:String,
        date_added:String,
        threat:String,
        reporter:String,
        larted:String,
        tag:[String]
    },
    {timestamps:true}
);
export default urlhausSchema;

export const getUrlhausModel = async (tenantId) => {
  const tenantDb = await getTenantDB(tenantId);
  return tenantDb.models.UrlhausData || tenantDb.model("UrlhausData", urlhausSchema);
}