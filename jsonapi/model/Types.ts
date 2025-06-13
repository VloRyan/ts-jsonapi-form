export type Primitive = string | number | boolean | null;

export interface ObjectLike {
  [member: string]: Value;
}

export type Arr = Array<Value>;

export type Value = Primitive | ObjectLike | Arr;

export type MetaObject = ObjectLike;

export type Link = string | { href: string; meta?: MetaObject };

export interface ImplementationInfo {
  version?: string;
  meta?: MetaObject;
}
