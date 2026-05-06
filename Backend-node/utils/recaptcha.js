import { RecaptchaEnterpriseServiceClient } from "@google-cloud/recaptcha-enterprise";
import fetch from "node-fetch";

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
  forceRest = process.env.RECAPTCHA_USE_REST === "true",
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
  const apiKey = process.env.RECAPTCHA_API_KEY;

  // Helper to normalize response object
  const normalize = (response) => {
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
  };

  // If forcing REST or no service account credentials present, attempt REST call.
  if (forceRest || apiKey) {
    try {
      if (!apiKey) throw new Error("RECAPTCHA_API_KEY not set");
      const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`;
      const body = {
        event: {
          token,
          siteKey,
          expectedAction: expectedAction || undefined,
        },
      };
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        return {
          valid: false,
          score: null,
          reasons: ["rest-error"],
          error: txt.slice(0, 400),
        };
      }
      const json = await resp.json();
      return normalize(json);
    } catch (err) {
      if (forceRest) {
        return {
          valid: false,
          score: null,
          reasons: ["rest-exception"],
          error: err.message,
        };
      }
      // Fall through to service account attempt if not forced
    }
  }

  // Service account / gcloud SDK path
  try {
    // If no GOOGLE_APPLICATION_CREDENTIALS and likely not on GCP, abort gracefully
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      return {
        valid: false,
        score: null,
        reasons: ["no-adc"],
        error:
          "No ADC (service account) credentials found. Set GOOGLE_APPLICATION_CREDENTIALS or supply RECAPTCHA_API_KEY + RECAPTCHA_USE_REST=true.",
      };
    }
    const client = getClient();
    const projectPath = client.projectPath(projectId);
    const request = {
      assessment: { event: { token, siteKey } },
      parent: projectPath,
    };
    const [response] = await client.createAssessment(request);
    return normalize(response);
  } catch (err) {
    return {
      valid: false,
      score: null,
      reasons: ["exception"],
      error: err.message,
    };
  }
}
