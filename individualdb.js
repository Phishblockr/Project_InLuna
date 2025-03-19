import { connect } from "./db-connenction.js";
import dotenv from "dotenv";

dotenv.config();
const url = `${process.env.MONGO_URI}/individual`;

let individualDb;

export const getGlobalDB = async () => {
  if (!individualDb) {
    individualDb = await connect(url);
  }
  return individualDb;
};
