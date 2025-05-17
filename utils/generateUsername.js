export const generateUsername = (email) => {
  const emailPrefix = email.split("@")[0];
  // const lastThreeDigits = phone.slice(-3);
  return `${emailPrefix}`.toLowerCase();
};
