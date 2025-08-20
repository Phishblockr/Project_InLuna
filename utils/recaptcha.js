import { RecaptchaEnterpriseServiceClient } from "@google-cloud/recaptcha-enterprise";

// Lazy singleton client
let _client;
function getClient() {
  if (!_client) {
    _client = new RecaptchaEnterpriseServiceClient();
  }
  return _client;
}

/**
 * Verify a reCAPTCHA Enterprise token and return risk score if valid.
 * Returns an object: { valid: boolean, score: number|null, reasons: string[], error?: string }
 */
export async function verifyRecaptchaToken({
  token,
  expectedAction,
  projectId = process.env.RECAPTCHA_PROJECT_ID,
  siteKey = process.env.RECAPTCHA_SITE_KEY,
}) {
  if (!token)
    return {
      valid: false,
      score: null,
      reasons: ["missing-token"],
      error: "Missing reCAPTCHA token",
    };
  if (!projectId || !siteKey) {
    return {
      valid: false,
      score: null,
      reasons: ["config-error"],
      error: "reCAPTCHA configuration missing",
    };
  }
  try {
    const client = getClient();
    const projectPath = client.projectPath(projectId);
    const request = {
      assessment: {
        event: {
          token,
          siteKey: siteKey,
        },
      },
      parent: projectPath,
    };
    const [response] = await client.createAssessment(request);
    if (!response.tokenProperties?.valid) {
      return {
        valid: false,
        score: null,
        reasons: [response.tokenProperties?.invalidReason || "invalid-token"],
      };
    }
    if (expectedAction && response.tokenProperties.action !== expectedAction) {
      return { valid: false, score: null, reasons: ["action-mismatch"] };
    }
    const score = response.riskAnalysis?.score ?? null;
    const reasons = response.riskAnalysis?.reasons?.map((r) => String(r)) || [];
    return { valid: true, score, reasons };
  } catch (err) {
    return {
      valid: false,
      score: null,
      reasons: ["exception"],
      error: err.message,
    };
  }
}
