export function arrayContains<T>(arr: T[], element: T): boolean {
  return arr.includes(element);
}

export function arrayCount<T>(arr: T[], predicate: (item: T) => boolean): number {
  return arr.filter(predicate).length;
}