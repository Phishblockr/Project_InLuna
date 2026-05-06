import fetch from "node-fetch";

export default async function verify(req, res) {
  const debug = process.env.RECAPTCHA_DEBUG === "true";
  const projectId =
    process.env.RECAPTCHA_PROJECT_ID || process.env.GCP_PROJECT_ID;
  try {
    if (process.env.RECAPTCHA_ENABLED !== "true") {
      return res.status(400).json({ ok: false, error: "recaptcha_disabled" });
    }
    const { token, action } = req.body || {};
    if (!token)
      return res.status(400).json({ ok: false, error: "missing_token" });
    if (!projectId)
      return res.status(500).json({ ok: false, error: "missing_project_id" });
    if (!process.env.RECAPTCHA_SITE_KEY)
      return res.status(500).json({ ok: false, error: "missing_site_key" });
    if (!process.env.RECAPTCHA_API_KEY)
      return res.status(500).json({ ok: false, error: "missing_api_key" });

    const expectedAction = action || "generic";
    const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${process.env.RECAPTCHA_API_KEY}`;

    const body = {
      event: {
        token,
        siteKey: process.env.RECAPTCHA_SITE_KEY,
        expectedAction,
      },
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await resp.json();
    if (debug) console.log("[reCAPTCHA] raw response:", JSON.stringify(data));

    if (!resp.ok) {
      return res
        .status(resp.status)
        .json({ ok: false, error: "http_error", status: resp.status, data });
    }

    const tokenProps = data.tokenProperties || {};
    const valid = tokenProps.valid;
    const score = data?.riskAnalysis?.score ?? 0;
    const reasons = data?.riskAnalysis?.reasons || [];
    const threshold = parseFloat(process.env.RECAPTCHA_MIN_SCORE || "0.5");

    const invalidReasonMap = {
      ACTION_MISMATCH: "Expected action does not match token action",
      INVALID_RESPONSE: "Token malformed or invalid",
      MISSING: "Token missing",
      EXPIRED: "Token expired",
      DUPE: "Token already used",
      SITE_MISMATCH: "Site key does not match request",
      BROWSER_ERROR: "Browser unable to complete challenge",
      UNKNOWN_INVALID_REASON: "Unknown invalid reason",
    };

    if (valid && score >= threshold) {
      return res.json({ ok: true, score, reasons });
    }

    let errorCode = "low_score_or_invalid";
    let details = {};

    if (!valid) {
      errorCode = "invalid_token";
      details = {
        actionReceived: tokenProps.action,
        expectedAction,
        invalidReason: tokenProps.invalidReason,
        invalidReasonDesc:
          invalidReasonMap[tokenProps.invalidReason] ||
          tokenProps.invalidReason ||
          "n/a",
      };
    } else if (score < threshold) {
      errorCode = "score_below_threshold";
      details = { score, threshold, reasons };
    }

    return res.status(400).json({
      ok: false,
      error: errorCode,
      score,
      threshold,
      reasons,
      ...(debug ? { tokenProperties: tokenProps, details } : { details }),
    });
  } catch (err) {
    console.error("reCAPTCHA verify error:", err);
    return res
      .status(500)
      .json({ ok: false, error: "verification_failed", message: err.message });
  }
}
