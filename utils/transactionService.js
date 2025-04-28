import {
  getAdminTransactionModel,
  getIndividualTransactionModel,
  getTenantTransactionModel,
} from "../models/paymentModels/TransactionsModel.js";

export const saveToAdminDB = async (tx) => {
  const AdminTransaction = await getAdminTransactionModel();
  await AdminTransaction.create(tx);
};

export const saveToUserDB = async (userId, tx) => {
  if (!userId) return;
  const UserTransaction = await getIndividualTransactionModel();
  await UserTransaction.create(tx);
};

export const saveToOrgDB = async (orgId, tx) => {
  if (!orgId) return;
  const OrgTransaction = await getTenantTransactionModel(orgId);
  await OrgTransaction.create(tx);
};
