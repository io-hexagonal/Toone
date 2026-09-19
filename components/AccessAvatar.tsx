// Map the original body/eye colors to the site's warm white and dark ground.
function channel(body: number, eye: number, foreground: number, background: number) {
  const slope = (background - foreground) / (eye - body);
  return { slope, intercept: (foreground - slope * body) / 255 };
}

/** Original transparent animation, inverted to #f0ede6 with #141413 eyes. */
export default function AccessAvatar() {
  return (
    <>
      <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
        <defs>
          <filter id="access-avatar-invert" colorInterpolationFilters="sRGB">
            <feComponentTransfer>
              <feFuncR type="linear" {...channel(8, 255, 240, 20)} />
              <feFuncG type="linear" {...channel(6, 255, 237, 20)} />
              <feFuncB type="linear" {...channel(11, 253, 230, 19)} />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/launch/toone-playful-480-v4.webp"
        alt=""
        width={240}
        height={240}
        style={{
          display: "block",
          width: 240,
          height: 240,
          flexShrink: 0,
          objectFit: "contain",
          filter: "url(#access-avatar-invert)",
          margin: "0 auto 24px",
        }}
      />
    </>
  );
}
