export declare const lowerKeysDeep: (obj: any, ignoreKeys?: string[]) => any;
export declare type Empty = undefined | null | false | "";
export declare const isEmptyString: (value: any) => value is string;
export declare const isEmptyObj: (obj: any) => boolean;
export declare const isEmptyArray: <T>(value: T[]) => boolean;
export declare const isEmpty: <T>(value: false | "" | T | null | undefined) => value is Empty;
