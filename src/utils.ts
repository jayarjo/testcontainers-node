import { isObject, lowerFirst, mapKeys, mapValues } from "lodash";

export const lowerKeysDeep = (obj: any, ignoreKeys: string[] = []): any => {
  return mapKeys(
    mapValues(obj, value => (isObject(value) ? lowerKeysDeep(value) : value)),
    (_, key) => (ignoreKeys.includes(key) ? key : lowerFirst(key))
  );
};

export type Empty = undefined | null | false | "";

export const isEmptyString = (value: any): value is string => typeof value === "string" && value.trim() === "";

export const isEmptyObj = (obj: any): boolean => {
  if (typeof obj !== "object") {
    return isEmpty(obj);
  } else {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        return false;
      }
    }
    return true;
  }
};

export const isEmptyArray = <T>(value: T[]): boolean => isEmpty(value) || (Array.isArray(value) && value.length === 0);

export const isEmpty = <T>(value: T | Empty): value is Empty =>
  value === undefined || value === null || value === false || isEmptyString(value) || isEmptyObj(value);
