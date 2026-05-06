import mongoose, { Types } from 'mongoose';
import { getTenantDB } from '../../tenantdb.js';

const userEmailSchema = new mongoose.Schema({
    orgId:{
        type:String,
        required:true,  
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    emailTemplateId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"EmailTemplate",
        required:true,
    },
    assignedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    },
    assignedDate:{
        type:Date,
        default:Date.now,
    },
    status:{
        type:String,
        enum:["assigned","completed","inprogress"],
        default:"assigned",
    },
})


export const getUserEmailModel = async (tenantId) => {
    const tenantDb = await getTenantDB(tenantId);
    return tenantDb.models.UserEmail || tenantDb.model("UserEmail", userEmailSchema);
}
