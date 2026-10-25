import type { Metadata } from "next";
import { SITE } from "./site";

/** Full per-page metadata so Facebook and other link previews get the right title, URL and image. */
export function pageMeta(path: string, title: string, description: string, image = "/og-image.png"): Metadata {
  const full = path === "/" ? title : `${title} | ${SITE.name}`;
  return {
    title: path === "/" ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url: path,
      siteName: SITE.name,
      title: full,
      description,
      locale: "en_US",
      images: [{ url: image, width: 1200, height: 630, alt: full }],
    },
    twitter: { card: "summary_large_image", title: full, description, images: [image] },
  };
}
