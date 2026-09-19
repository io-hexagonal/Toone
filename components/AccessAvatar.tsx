/** Same retina animation as the lifecycle emails, displayed without scaling distortion. */
export default function AccessAvatar() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/assets/email/toone-playful-v4.gif"
      alt=""
      width={240}
      height={240}
      style={{
        display: "block",
        width: 240,
        height: 240,
        flexShrink: 0,
        objectFit: "contain",
        background: "#f0ede6",
        borderRadius: 24,
        margin: "0 auto 24px",
      }}
    />
  );
}
