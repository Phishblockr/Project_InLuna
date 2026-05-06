// Simple disposable / temp mail detector using a regex of common domains.
// Extend this list as needed; keep it sorted for readability.
// NOTE: Regex intentionally anchors after the @ to avoid false positives in local-part.

const disposableDomainRegex = new RegExp(
  "@(" +
    [
      // Generic/brand patterns first
      "10minutemail.com",
      "10minutemail.net",
      "guerrillamail.com",
      "guerrillamail.de",
      "guerrillamail.biz",
      "guerrillamail.net",
      "sharklasers.com",
      "mailinator.com",
      "mailinator.net",
      "mailinator.org",
      "yopmail.com",
      "yopmail.fr",
      "yopmail.net",
      "temp-mail.org",
      "tempmail.com",
      "tempmail.dev",
      "tempmailaddress.com",
      "trashmail.com",
      "trashmail.io",
      "getnada.com",
      "dropmail.me",
      "maildrop.cc",
      "dispostable.com",
      "emailondeck.com",
      "fakeinbox.com",
      "mintemail.com",
      "mytrashmailer.com",
      "rcpt.at",
      "spamgourmet.com",
    ].join("|") +
    ")$",
  "i"
);

export function isDisposableEmail(email) {
  if (!email || typeof email !== "string" || !email.includes("@")) return false; // let other validators handle structure
  // Extract domain part only for safety
  const domain = email.split("@").pop();
  return disposableDomainRegex.test("@" + domain);
}

export default isDisposableEmail;
