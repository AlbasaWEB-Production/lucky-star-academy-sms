"use client";

import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import NextLink from "next/link";

/**
 * Client-component wrapper around next/link.
 *
 * Needed because of a Next.js 16 restriction: passing `next/link` straight
 * into an MUI `component` prop - `<Button component={Link}>` - triggers
 * "Functions cannot be passed directly to Client Components". Importing this
 * wrapper instead is the documented workaround.
 *
 * The props type intersects next/link's own props with the plain anchor
 * attributes, because Next 16's LinkProps does not surface `style`, which
 * callers legitimately want for a quick inline tweak.
 */
type AnchorAttributes = Omit<ComponentPropsWithoutRef<"a">, "href">;

const Link = forwardRef<
  HTMLAnchorElement,
  ComponentPropsWithoutRef<typeof NextLink> & AnchorAttributes & { children?: ReactNode }
>(function Link(props, ref) {
  return <NextLink ref={ref} {...props} />;
});

export default Link;
