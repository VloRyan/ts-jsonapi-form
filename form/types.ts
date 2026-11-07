const discriminators = [
  "attribute",
  "relationship",
  "link",
  "metadata",
] as const;
export type Discriminator = (typeof discriminators)[number];
export function asDiscriminator(s: string): Discriminator | undefined {
  if (!discriminators.includes(s as Discriminator)) {
    return undefined;
  }
  return s as Discriminator;
}
