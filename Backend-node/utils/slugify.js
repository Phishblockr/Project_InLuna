// Small slugify helper used across the app
export function toSlug(value = "") {
  try {
    return String(value)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-") // spaces -> hyphens
      .replace(/[^a-z0-9-_]/g, "") // strip invalid chars
      .replace(/-+/g, "-") // collapse repeated hyphens
      .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
  } catch (e) {
    return "";
  }
}

export default toSlug;
