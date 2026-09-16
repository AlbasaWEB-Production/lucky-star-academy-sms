import Image from "next/image";
import { Box } from "@mui/material";

/**
 * Real photographs of Lucky Star Academy pupils, shown on the landing hero.
 *
 * These are the school's own photographs — the same ones used on the printed
 * admission flyer. Drop the files into `public/photos/` using the names
 * below; each one is rendered into a fixed-aspect box with `object-fit: cover`,
 * so the source crops do not need to match each other in size or ratio.
 *
 * `sizes` is set for the two breakpoints the collage actually renders at, so
 * Next.js serves a ~260px-wide image on desktop rather than the full original.
 */

type Photo = {
  src: string;
  /** Describes the photo for screen readers. Never leave this empty. */
  alt: string;
  /** Vertical offset in px, applied from `md` up, to stagger the grid. */
  offset: number;
};

const PHOTOS: Photo[] = [
  {
    src: "/photos/pupils-ict.jpg",
    alt: "Lucky Star Academy pupils working at computers in the ICT laboratory",
    offset: 0,
  },
  {
    src: "/photos/pupils-culture.jpg",
    alt: "Pupils in traditional dress playing drums during a cultural display",
    offset: 32,
  },
  {
    src: "/photos/pupils-sports.jpg",
    alt: "Pupils playing football on the school field",
    offset: -16,
  },
  {
    src: "/photos/pupils-garden.jpg",
    alt: "Pupils watering a tree seedling in the school garden",
    offset: 16,
  },
];

export default function StudentPhotoCollage() {
  return (
    <Box
      aria-label="Life at Lucky Star Academy"
      role="group"
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: { xs: 1.5, md: 2 },
        width: "100%",
        maxWidth: { xs: 420, md: 560 },
        mx: { xs: "auto", md: 0 },
        ml: { md: "auto" },
      }}
    >
      {PHOTOS.map((photo, index) => (
        <Box
          key={photo.src}
          sx={{
            position: "relative",
            aspectRatio: "4 / 3",
            borderRadius: "20px",
            overflow: "hidden",
            boxShadow: "0 14px 32px rgba(8, 62, 40, 0.14)",
            transform: { xs: "none", md: `translateY(${photo.offset}px)` },
          }}
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            priority={index < 2}
            sizes="(min-width: 900px) 260px, 45vw"
            style={{ objectFit: "cover" }}
          />
        </Box>
      ))}
    </Box>
  );
}
