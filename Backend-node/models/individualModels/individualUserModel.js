import userSchema from "../userModel.js"
import { getGlobalDB } from '../../individualdb.js';

export const getIndividualUserModel = async () => {
  const db = await getGlobalDB();
  return db.models.User || db.model('User', userSchema);
};