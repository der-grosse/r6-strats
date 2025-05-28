/**
 * Creates a deep copy of an object.
 */
export function deepCopy<T extends any>(obj: T): T {
  if (typeof obj !== "object") return obj;
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map((ele) => deepCopy(ele)) as T;
  if (obj instanceof Date) return new Date(obj) as T;
  return Object.fromEntries(deepCopy(Object.entries(obj as Object))) as T;
}
