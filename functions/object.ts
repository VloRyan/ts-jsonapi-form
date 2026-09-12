// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getValue = (obj: any, path: string): any | undefined => {
  const parts = splitPath(path);
  const traversedPath = traversePath(obj, parts);

  if (traversedPath.length != parts.length) {
    return undefined;
  }
  return traversedPath[traversedPath.length - 1]!.value;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const setValue = (obj: any, path: string, value: any) => {
  const parts = splitPath(path);
  const traversedPath = traversePath(obj, parts);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parentObj: any;
  if (traversedPath.length < parts.length - 1) {
    if (
      parts.find((e: PathElement) => {
        return e.identifier;
      })
    ) {
      throw Error("cannot create new array field");
    }
    let currentObj =
      traversedPath.length > 0
        ? traversedPath[traversedPath.length - 1]!.value
        : obj;
    for (let i = traversedPath.length; i < parts.length - 1; i++) {
      currentObj[parts[i]!.name] = {};
      currentObj = currentObj[parts[i]!.name];
    }
    parentObj = currentObj;
  } else {
    parentObj =
      traversedPath.length > 1
        ? traversedPath[traversedPath.length - 2]!.value
        : obj;
  }

  const lastPart = parts[parts.length - 1]!;
  if (lastPart.identifier === undefined) {
    parentObj[lastPart.name] = value;
  } else {
    const element = parentObj[lastPart.name];
    if (Array.isArray(element)) {
      const index = Number.parseInt(lastPart.identifier, 10);
      if (!Number.isNaN(index)) {
        element[index] = value;
      }
    } else if (element instanceof Map) {
      element.set(lastPart.identifier, value);
    } else {
      throw Error("unknown element container");
    }
  }
};

interface PathElement {
  name: string;
  identifier?: string | undefined;
}

export const splitPath = (path: string): PathElement[] => {
  if (typeof path !== "string") {
    return [];
  }
  const parts: PathElement[] = [];
  let currentPart = "";
  let identifierStart = -1;
  let currentIdentifier: string | undefined = undefined;
  for (let i = 0; i < path.length; i++) {
    const c = path[i];
    if (c == "." && identifierStart == -1) {
      parts.push({ name: currentPart, identifier: currentIdentifier });
      currentPart = "";
      currentIdentifier = undefined;
      continue;
    } else if (c == "[") {
      if (identifierStart > -1) {
        throw Error(
          "found unexpected identifier start at: " +
            i +
            ". Previous started at: " +
            identifierStart,
        );
      }
      identifierStart = i;
      continue;
    } else if (c == "]") {
      if (identifierStart == -1) {
        throw Error("found unexpected identifier end at: " + i);
      }
      identifierStart = -1;
      continue;
    } else if (identifierStart != -1) {
      currentIdentifier = currentIdentifier ? currentIdentifier + c : c;
      continue;
    }
    currentPart += c;
  }
  parts.push({ name: currentPart, identifier: currentIdentifier });
  return parts;
};

interface TraversedPathElement extends PathElement {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
}

const traversePath = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any,
  path: PathElement[],
): TraversedPathElement[] => {
  const traversedPath: TraversedPathElement[] = [];
  if (!obj) {
    return traversedPath;
  }
  let currentObj = obj;
  for (const element of path) {
    const partObj = currentObj[element.name];
    if (partObj === undefined) {
      break;
    }
    if (element.identifier !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let elementObj: any = undefined;
      if (Array.isArray(partObj)) {
        const index = Number.parseInt(element.identifier, 10);
        if (!Number.isNaN(index)) {
          elementObj = partObj[index];
        }
      } else if (partObj instanceof Map) {
        elementObj = partObj.get(element.identifier);
      }
      if (elementObj === undefined) {
        break;
      }
      currentObj = elementObj;
    } else {
      currentObj = partObj;
    }
    traversedPath.push({ ...element, value: currentObj });
  }
  return traversedPath;
};
