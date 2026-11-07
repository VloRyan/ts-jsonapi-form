import type { AnyObject } from "@jsonapi/model";
import { isAlphaNumeric } from "@functions/strings";

export const getValue = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any,
  path: string | PathElement[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any | undefined => {
  const pathElements = typeof path == "string" ? splitPath(path) : path;
  const traversedPath = traversePath(obj, pathElements);

  if (traversedPath.length - 1 != pathElements.length) {
    return undefined;
  }
  return traversedPath[traversedPath.length - 1]!.value;
};

export const setValue = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any,
  path: string | PathElement[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
) => {
  const pathElements = typeof path == "string" ? splitPath(path) : path;
  const traversedPath = traversePath(obj, pathElements, true);
  if (traversedPath.length - 1 != pathElements.length) {
    throw Error("error");
  }
  const parentNode = traversedPath[traversedPath.length - 2]!.value;
  const lastPart = pathElements[pathElements.length - 1]!;
  if (lastPart.index === undefined) {
    setValueOn(parentNode, lastPart.name, value);
  } else {
    setValueOn(parentNode, lastPart.name, value, lastPart.index);
  }
};

function setValueOn(
  parentNode: AnyObject,
  fieldName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
  index: number | undefined = undefined,
) {
  if (index === undefined) {
    if (parentNode instanceof Map) {
      parentNode.set(fieldName, value);
    } else {
      parentNode[fieldName] = value;
    }
  } else {
    const container = parentNode[fieldName];
    if (Array.isArray(container)) {
      container[index] = value;
    } else {
      throw Error(
        "invalid container type: expected array got " + typeof container,
      );
    }
  }
}

export class PathElement {
  name: string;
  index?: number | undefined;
  constructor(name: string, index: number | undefined = undefined) {
    this.name = name;
    this.index = index;
  }
}

export const splitPath = (path: string): PathElement[] => {
  const parts: PathElement[] = [];
  let currentPart = "";
  let isInString = false;
  let isInBrackets = false;
  let indexStr = "";
  for (let i = 0; i < path.length; i++) {
    const c = path[i]!;
    switch (c) {
      case ".": {
        if (isInString) {
          currentPart += c;
        } else {
          const index = indexStr ? Number.parseInt(indexStr!, 10) : undefined;
          parts.push(
            new PathElement(
              currentPart,
              index !== undefined && !Number.isNaN(index) ? index : undefined,
            ),
          );
          currentPart = "";
          indexStr = "";
        }
        break;
      }
      case "[": {
        if (isInBrackets) {
          throw Error(`another start of brackets at: ${i}`);
        }
        isInBrackets = true;
        break;
      }
      case "]": {
        if (!isInBrackets) {
          throw Error(`invalid character at: ${i}`);
        }
        isInBrackets = false;
        break;
      }
      case '"': {
        if (isInString) {
          if (currentPart.length === 0) {
            throw Error(`invalid string at: ${i}`);
          }
        }
        isInString = !isInString;
        break;
      }
      default: {
        if (!isAlphaNumeric(c) && c != "-") {
          throw Error(`invalid character '${c}' at: ${i}`);
        }
        if (isInBrackets) {
          indexStr += c;
        } else {
          currentPart += c;
        }
      }
    }
  }
  if (currentPart.length > 0) {
    const index = indexStr ? Number.parseInt(indexStr!, 10) : undefined;
    parts.push(
      new PathElement(
        currentPart,
        index !== undefined && !Number.isNaN(index) ? index : undefined,
      ),
    );
  }
  return parts;
};

export class TraversedPathElement extends PathElement {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  constructor(
    element: PathElement,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any = undefined,
  ) {
    super(element.name, element.index);
    this.value = value;
  }
}

export const traversePath = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any,
  path: PathElement[],
  createMissingElements: boolean = false,
): TraversedPathElement[] => {
  const traversedPath: TraversedPathElement[] = [];
  if (!obj) {
    return traversedPath;
  }
  let parentObj = obj;
  traversedPath.push(new TraversedPathElement(new PathElement("."), parentObj));
  for (const pathElement of path) {
    let currentObj = pathElement.name
      ? parentObj instanceof Map
        ? parentObj.get(pathElement.name)
        : parentObj[pathElement.name]
      : parentObj;
    if (currentObj === undefined) {
      if (!createMissingElements || !pathElement.name) {
        break;
      }
      currentObj =
        pathElement.index !== undefined
          ? new Array(pathElement.index! + 1)
          : {};
      parentObj[pathElement.name] = currentObj;
    }
    if (pathElement.index !== undefined) {
      if (
        currentObj[pathElement.index!] === undefined &&
        createMissingElements
      ) {
        currentObj[pathElement.index!] = {};
      }
      const elementObj = currentObj[pathElement.index!];
      if (elementObj === undefined) {
        break;
      }
      currentObj = elementObj;
    }
    parentObj = currentObj;
    traversedPath.push(new TraversedPathElement(pathElement, parentObj));
  }
  return traversedPath;
};
