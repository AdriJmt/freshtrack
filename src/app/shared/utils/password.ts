/** BCrypt accepts at most 72 UTF-8 bytes, including non-ASCII passwords. */
export function validPassword(value: string): boolean {
  return (
    value.length >= 8 &&
    value.length <= 72 &&
    new TextEncoder().encode(value).length <= 72
  );
}
