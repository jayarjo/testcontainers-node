"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
exports.lowerKeysDeep = (obj) => {
    return lodash_1.mapKeys(lodash_1.mapValues(obj, value => (lodash_1.isObject(value) ? exports.lowerKeysDeep(value) : value)), (_, key) => lodash_1.lowerFirst(key));
};
exports.isEmptyString = (value) => typeof value === "string" && value.trim() === "";
exports.isEmptyObj = (obj) => {
    if (typeof obj !== "object") {
        return exports.isEmpty(obj);
    }
    else {
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                return false;
            }
        }
        return true;
    }
};
exports.isEmptyArray = (value) => exports.isEmpty(value) || (Array.isArray(value) && value.length === 0);
exports.isEmpty = (value) => value === undefined || value === null || value === false || exports.isEmptyString(value) || exports.isEmptyObj(value);
