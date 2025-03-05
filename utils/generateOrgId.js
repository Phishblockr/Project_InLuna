const generateRandomAlphaNumeric = (length) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

export const generateUniqueOrgId = async (TenantModel) => {
    let newOrgId;
    let exists = true;
    // Loop until a unique orgId is found
    while (exists) {
        newOrgId = generateRandomAlphaNumeric(6);
        exists = await TenantModel.findOne({ orgId: newOrgId });
    }
    return newOrgId;
};
