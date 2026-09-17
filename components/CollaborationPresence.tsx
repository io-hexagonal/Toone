type Props = {
  tooltip: string;
};

/** Decorative shared-presence cursors used by the highlighted Live Share row. */
export default function CollaborationPresence({ tooltip }: Props) {
  return (
    <div className="collab-presence" aria-hidden="true">
      <div className="collab-cursor collab-cursor--one">
        <svg viewBox="0 0 34 42" role="presentation">
          <path
            d="M4 2.5 29 25.2h-11l6 12.2-6.2 2.9-5.8-12.1-7.9 8.1L4 2.5Z"
            fill="currentColor"
            stroke="#f8f5ee"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      </div>
      <div className="collab-cursor collab-cursor--two">
        <svg viewBox="0 0 34 42" role="presentation">
          <path
            d="M4 2.5 29 25.2h-11l6 12.2-6.2 2.9-5.8-12.1-7.9 8.1L4 2.5Z"
            fill="currentColor"
            stroke="#f8f5ee"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
        <span className="collab-tooltip">
          {tooltip}
          <span className="collab-tooltip-beta">Beta</span>
        </span>
      </div>
    </div>
  );
}
