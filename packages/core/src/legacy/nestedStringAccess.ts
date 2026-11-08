// @ts-nocheck -- legacy code copied 1:1 from legacy/angular; typed in P03-S06
export function nestedStringAccess(value: object, accessorString: string) {
  return accessorString.split('.').reduce((o, i) => o[i], value);
}
