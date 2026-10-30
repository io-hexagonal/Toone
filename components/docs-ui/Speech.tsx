import type { CSSProperties } from "react";
import { Glyph } from "./glyphs";
import { PulsingDot } from "./PulsingDot";
import styles from "./Speech.module.css";

/**
 * Voice and meeting pieces (main repo, apps/toone-desktop/Toone/Toone/).
 *
 * - RecordingIndicator   Features/Speech/Views/RecordingIndicatorView.swift:31-190.
 *                        HStack spacing 8: mic (32pt ZStack: outer ring accent
 *                        @0.15, scale 0.9 ↔ 1.2 + opacity 0 ↔ 0.6 over 1.2s;
 *                        inner 26pt accent @0.25; mic.fill 13pt semibold
 *                        accent) · locale badge (caption2 bold accent,
 *                        padding 4/2, accent @0.15, r3) · nine 3pt bars
 *                        (spacing 2.5, r1.5, accent 0.9 → 0.5 gradient, rest
 *                        4pt, peak 24 × envelope 0.5…1, each with its own
 *                        duration 0.4 + (i%3)·0.15 + ((7i)%5)·0.08 and delay
 *                        0.06·i) · live text (.body, 2 lines, head
 *                        truncation; "Listening..." tertiary when empty) ·
 *                        Spacer · cancel xmark.circle.fill .title3 tertiary.
 * - AudioMessageBubble   Features/Chat/Views/RichMessageBubble.swift:1493-1566.
 *                        HStack spacing 8, padding 12/10: speaker.wave.2
 *                        (Room, orange) or waveform (Voice, theme accent)
 *                        14pt medium · "<Room|Voice> message" subheadline ·
 *                        five 2.5pt bars 6/10/14/10/6 @0.6; tint @0.12 fill,
 *                        tint @0.25 1pt inside stroke, r12. The transcript
 *                        shows only on hover (not drawn).
 * - MeetingListeningCard Features/Chat/Views/ChatPanelView.swift:1795-1852.
 *                        VStack spacing 8, padding 8, red @0.08 fill + red
 *                        @0.25 1pt stroke, r12: PulsingDot(10, red) ·
 *                        "Meeting mode active" subheadline medium ·
 *                        "Listening to mic & system audio · EN" caption
 *                        secondary · Spacer · "N segments" caption2 tertiary;
 *                        then a full-width Stop Listening button (stop.fill
 *                        caption2 + caption medium, white on red @0.85,
 *                        padding 14/6, r8).
 *
 * Motion only under prefers-reduced-motion: no-preference; the static frame
 * shows the ring and bars mid-animation.
 */

const BARS = 9;
const REST = 4;
const PEAK = 24;
/** A frozen mid-animation frame for reduced motion (fraction of each bar's peak). */
const STATIC_FRAME = [0.5, 0.85, 0.45, 1, 0.65, 0.9, 0.4, 0.75, 0.55];

function barTarget(i: number) {
  const center = (BARS - 1) / 2;
  const distance = Math.abs(i - center) / center;
  return PEAK * (1 - distance * 0.5);
}

export function RecordingIndicator({
  text,
  locale,
  cancellable = true,
}: {
  /** The volatile transcript; empty shows "Listening...". */
  text: string;
  locale?: string;
  cancellable?: boolean;
}) {
  return (
    <div className={styles.recording}>
      <span className={styles.mic}>
        <span className={styles.micRing} />
        <span className={styles.micInner} />
        <Glyph color="var(--tu-accent)" name="mic.fill" size={15} style={{ position: "relative" }} weight="semibold" />
      </span>
      {locale ? <span className={styles.locale}>{locale}</span> : null}
      <span className={styles.bars}>
        {Array.from({ length: BARS }, (_, i) => {
          const target = barTarget(i);
          const duration = 0.4 + (i % 3) * 0.15 + ((i * 7) % 5) * 0.08;
          return (
            <span
              className={styles.bar}
              key={i}
              style={
                {
                  height: target,
                  "--bar-rest": REST / target,
                  "--bar-static": Math.max(REST / target, STATIC_FRAME[i]),
                  "--bar-duration": `${duration}s`,
                  "--bar-delay": `${i * 0.06}s`,
                } as CSSProperties
              }
            />
          );
        })}
      </span>
      {text ? (
        <span className={styles.live}>{text}</span>
      ) : (
        <span className={styles.listening}>Listening...</span>
      )}
      {cancellable ? (
        <Glyph
          color="var(--tu-text-3)"
          name="xmark.circle.fill"
          size={17}
          style={{ marginLeft: "auto", ["--tu-glyph-knockout" as string]: "var(--tu-panel)" }}
        />
      ) : null}
    </div>
  );
}

export function AudioMessageBubble({ source }: { source: "room" | "voice" }) {
  const room = source === "room";
  return (
    <div className={styles.audio} data-room={room ? "true" : undefined}>
      <Glyph name={room ? "speaker.wave.2" : "waveform"} size={16} weight="medium" />
      <span className={styles.audioLabel}>{room ? "Room" : "Voice"} message</span>
      <span className={styles.audioBars}>
        {[6, 10, 14, 10, 6].map((h, i) => (
          <span key={i} style={{ height: h }} />
        ))}
      </span>
    </div>
  );
}

export function MeetingListeningCard({ locale, segments }: { locale: string; segments: number }) {
  return (
    <div className={styles.meeting}>
      <div className={styles.meetingRow}>
        <PulsingDot color="var(--tu-error)" size={10} />
        <span className={styles.meetingText}>
          <span className={styles.meetingTitle}>Meeting mode active</span>
          <span className={styles.meetingSub}>Listening to mic &amp; system audio · {locale}</span>
        </span>
        <span className={styles.meetingCount}>
          {segments} segment{segments === 1 ? "" : "s"}
        </span>
      </div>
      <span className={styles.stop}>
        <Glyph name="stop.fill" size={10} />
        Stop Listening
      </span>
    </div>
  );
}
