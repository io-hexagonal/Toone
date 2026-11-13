/**
 * Ties a form error to the field it is about: `aria-invalid` on the field and
 * the error's id in its `aria-describedby`, after any help text it already
 * names. Spread the result onto the input; give the error element `errorId`.
 */
export function fieldErrorProps(
  invalid: boolean,
  errorId: string,
  ...describedBy: (string | false | null | undefined)[]
): { "aria-invalid"?: true; "aria-describedby"?: string } {
  const ids = describedBy.filter((id): id is string => typeof id === "string" && id.length > 0);
  if (invalid) ids.push(errorId);
  return {
    ...(invalid ? { "aria-invalid": true as const } : {}),
    ...(ids.length ? { "aria-describedby": ids.join(" ") } : {}),
  };
}
