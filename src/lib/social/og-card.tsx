import { ImageResponse } from "next/og";

type OgCardOptions = {
  eyebrow: string;
  title: string;
  description: string;
  imagePath?: string;
};

export const ogImageSize = {
  width: 1200,
  height: 630,
} as const;

export const ogImageContentType = "image/png";

function buildAbsoluteAssetUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `https://www.soliprode.com${normalizedPath}`;
}

export async function buildOgCard({
  eyebrow,
  title,
  description,
  imagePath = "/lio_copa.jpeg",
}: OgCardOptions) {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          position: "relative",
          backgroundColor: "#031a4a",
          color: "#ffffff",
          fontFamily: "Arial, sans-serif",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={buildAbsoluteAssetUrl(imagePath)}
          alt=""
          width={1200}
          height={630}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "55% 20%",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(0,23,74,0.92) 0%, rgba(0,52,125,0.72) 42%, rgba(0,52,125,0.18) 100%)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: "54px 58px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={buildAbsoluteAssetUrl("/icon-192.png")}
              alt=""
              width={74}
              height={74}
              style={{
                width: 74,
                height: 74,
                borderRadius: 18,
                background: "#0d1d63",
                padding: 10,
              }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  color: "#ffe16d",
                }}
              >
                {eyebrow}
              </div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 600,
                  color: "#dce7ff",
                }}
              >
                www.soliprode.com
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              maxWidth: 700,
              gap: 18,
            }}
          >
            <div
              style={{
                fontSize: 76,
                lineHeight: 0.95,
                fontWeight: 800,
                letterSpacing: -2,
                textTransform: "uppercase",
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 32,
                lineHeight: 1.25,
                color: "#eef4ff",
              }}
            >
              {description}
            </div>
          </div>
        </div>
      </div>
    ),
    ogImageSize,
  );
}
