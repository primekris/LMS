/**
 * FastAPI returns errors in two shapes:
 *  - HTTPException: { detail: "some string" }
 *  - Pydantic validation (422): { detail: [{ type, loc, msg, input, ctx }, ...] }
 * This normalizes either into a plain, renderable string.
 */
export function extractErrorMessage(err, fallback = "Something went wrong. Please try again.") {
  const detail = err?.response?.data?.detail;

  if (!detail) return fallback;
  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        if (typeof d === "string") return d;
        const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : null;
        return field ? `${field}: ${d.msg}` : d.msg;
      })
      .filter(Boolean)
      .join(" ");
  }

  return fallback;
}
