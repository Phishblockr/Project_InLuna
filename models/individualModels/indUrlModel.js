import { getGlobalDB } from '../../individualdb.js';
import urlSchema from "../urlModel.js";

export const getIndividualUrlModel = async () => {
  const db = await getGlobalDB();
  return db.models.User || db.model('Url', urlSchema);
};