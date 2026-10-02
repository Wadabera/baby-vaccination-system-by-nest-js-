/**
 * Turns a failed axios request into a message worth showing a user.
 *
 * The direct `err.response?.data?.message || "Something went wrong"` idiom that
 * this replaces is wrong in two ways that both show up in production:
 *
 * 1. When there is no response at all — DNS failure, the API being asleep, or
 *    a CORS rejection — the browser gives an opaque `Failed to fetch`, and the
 *    expression collapses to its fallback. On the sign-in form that fallback
 *    reads "Invalid username or password", which sends an operator hunting for
 *    a password problem when the real cause is a blocked cross-origin request.
 *
 * 2. NestJS's `ValidationPipe` answers with `message` as an *array* of strings,
 *    one per failed rule. Rendering that array directly gives the user a
 *    comma-welded wall of jargon, so the rules are joined into a sentence.
 *
 * `fallback` is the message to use when the server said nothing useful.
 */
export function apiErrorMessage(error, fallback = "Something went wrong") {
  const response = error?.response;

  if (!response) {
    // Aborts are a deliberate user action, not a failure to report.
    if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") {
      return "";
    }

    // No response reached us at all. Distinguish the two realistic causes so
    // the message points somewhere actionable rather than just restating that
    // something broke.
    const offline =
      typeof navigator !== "undefined" && navigator.onLine === false;

    if (offline) {
      return "You appear to be offline. Check your connection and try again.";
    }

    return (
      "Could not reach the server. It may be starting up — if this keeps " +
      "happening, the API address or its CORS settings may be wrong."
    );
  }

  const message = response.data?.message;

  if (Array.isArray(message)) {
    const rules = message.filter(Boolean);
    if (rules.length > 0) return rules.join(". ");
  } else if (typeof message === "string" && message.trim()) {
    return message;
  }

  // NestJS status messages are terse and occasionally blank; give the code
  // something concrete rather than a bare number.
  if (response.status === 401) return "Your session has expired. Sign in again.";
  if (response.status === 403) {
    return "Your account does not have permission to do that.";
  }
  if (response.status === 404) return fallback;
  if (response.status >= 500) {
    return "The server ran into a problem. Please try again shortly.";
  }

  return fallback;
}

export default apiErrorMessage;
