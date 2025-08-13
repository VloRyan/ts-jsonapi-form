import { ObjectLike } from "../jsonapi/model/";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getValue = (obj: any, path: string) => {
  return findField(obj, path);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const setValue = (obj: any, path: string, value: any) => {
  const parts = splitPath(path);
  const attribName = parts[parts.length - 1];
  if (parts.length == 1) {
    const arrStart = attribName.indexOf("[");
    if (arrStart > -1) {
      const elemIdx = +attribName.substring(
        arrStart + 1,
        attribName.indexOf("]"),
      );
      const fieldName = attribName.substring(0, arrStart);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const field: any = findField(obj, fieldName) as [];
      field[elemIdx] = value;
    } else {
      obj[attribName] = value;
    }
  } else {
    const objPath = parts.slice(0, parts.length - 1);
    const arrStart = attribName.indexOf("[");
    if (arrStart > -1) {
      const elemIdx = +attribName.substring(
        arrStart + 1,
        attribName.indexOf("]"),
      );
      objPath.push(attribName.substring(0, arrStart));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parentField: any = findField(obj, objPath) as [];
      parentField[elemIdx] = value;
    } else {
      let parentField = findField(obj, objPath);
      if (!parentField) {
        createPath(obj, objPath);
        parentField = findField(obj, objPath);
        if (!parentField) {
          throw Error("failed to find field: " + objPath.join("."));
        }
      }
      parentField[attribName] = value;
    }
  }
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createPath = (obj: any, path: string | string[]) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let currentObj: any = obj;
  splitPath(path).forEach((part) => {
    let nextObj = currentObj[part];
    if (!nextObj) {
      nextObj = {};
      currentObj[part] = nextObj;
    }
    currentObj = nextObj;
  });
};
export const splitPath = (path: string | string[]) => {
  if (typeof path !== "string") {
    return path;
  }
  const parts = [];
  let currentPart = "";
  let inString = false;
  for (let i = 0; i < path.length; i++) {
    const c = path[i];
    if (c == "." && !inString) {
      parts.push(currentPart);
      currentPart = "";
      continue;
    } else if (c == '"') {
      inString = !inString;
      continue;
    }
    currentPart += c;
  }
  parts.push(currentPart);
  return parts;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const findField = (obj: any, path: string | string[]) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: any;
  if (!obj) {
    return undefined;
  }
  splitPath(path).forEach((part, index, array) => {
    if (obj === undefined) {
      return undefined;
    }
    let elemIdx = "";
    const arrStart = part.indexOf("[");
    if (arrStart !== -1) {
      elemIdx = part.substring(arrStart + 1, part.indexOf("]"));
      part = part.substring(0, arrStart);
    }
    const partValue = getValueFrom(obj, part);
    if (index === array.length - 1) {
      const partValue = getValueFrom(obj, part);
      if (partValue === undefined) {
        result = undefined;
      } else {
        if (elemIdx !== "") {
          result = getValueFrom(partValue, elemIdx);
        } else {
          result = partValue;
        }
      }
      return undefined;
    }
    if (elemIdx !== "") {
      if (partValue === undefined) {
        result = undefined;
      } else {
        obj = getValueFrom(partValue, elemIdx);
      }
    } else {
      obj = partValue as ObjectLike;
    }
  });
  return result;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getValueFrom(obj: any, key: string) {
  if (key == "") {
    return obj;
  }
  if (obj instanceof Map) {
    return obj.get(key);
  }
  return obj[key];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const removeField = (obj: any, path: string) => {
  const parts = splitPath(path);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parentObj: any;
  if (parts.length == 1) {
    parentObj = obj;
  } else {
    const objPath = parts.slice(0, parts.length - 1);
    parentObj = findField(obj, objPath);
    if (!obj) {
      throw new Error(`field not found: ${path}`);
    }
  }
  let fieldName = parts[parts.length - 1];
  let elemIdx = "";
  const arrStart = fieldName.indexOf("[");
  if (arrStart !== -1) {
    elemIdx = fieldName.substring(arrStart + 1, fieldName.indexOf("]"));
    fieldName = fieldName.substring(0, arrStart);
  }
  if (elemIdx != "") {
    parentObj[fieldName].splice(elemIdx, 1);
  } else {
    delete parentObj[fieldName];
  }
};
