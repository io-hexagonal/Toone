export default function AccessAvatar() {
  return (
    <video
      aria-hidden="true"
      width={240}
      height={240}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      poster="/assets/launch/toone-playful-240-warm-poster.webp"
      style={{
        display: "block",
        width: 240,
        height: 240,
        flexShrink: 0,
        objectFit: "contain",
        mixBlendMode: "lighten",
        margin: "0 auto 24px",
      }}
    >
      <source src="/assets/launch/toone-playful-240-warm.mp4" type="video/mp4" />
    </video>
  );
}
