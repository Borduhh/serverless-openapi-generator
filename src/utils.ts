export const clone = (obj: { [key: string]: any }) => JSON.parse(JSON.stringify(obj));
