import {jwtDecode} from "jwt-decode";

export const getOrgIdFromToken = (token) => {
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    return decoded.orgId || null;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};
