export type Primitive = string | number | boolean;

export interface AnyObject {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [member: string]: any;
}
export interface ObjectLike {
  [member: string]: AttributeValue;
}

export type Arr = Array<AttributeValue>;

export type AttributeValue = Primitive | ObjectLike | Arr | undefined | null;

export type MetaObject = ObjectLike;

export type Link = string | LinkObject | null;

export type LinkObject = {
  href: string;
  rel?: string;
  describedby?: Link;
  title?: string;
  type?: string;
  hreflang?: string;
  meta?: MetaObject;
};

export interface ImplementationInfo {
  version?: string;
  meta?: MetaObject;
}
