/** Styles shared by the success and cancel pages (dark ground, one centred card). */
export const CHECKOUT_RETURN_STYLES = `
  .pro-return {
    min-height: 100vh; display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 48px 20px 64px; color: rgba(255,255,255,0.94);
  }
  .pro-return-brand {
    display: inline-flex; align-items: center; gap: 10px;
    text-decoration: none; margin-bottom: 34px;
  }
  .pro-return-brand img { width: 30px; height: 30px; display: block; }
  .pro-return-brand .wm {
    font-family: var(--font-wordmark), system-ui, sans-serif;
    font-weight: 600; letter-spacing: -0.03em; text-transform: lowercase;
    color: rgba(255,255,255,0.92); font-size: 20px;
  }
  .pro-return-card {
    width: 100%; max-width: 440px; text-align: center;
    border: 1px solid rgba(255,255,255,0.11); border-radius: 20px;
    background: rgba(255,255,255,0.035); padding: 32px 28px;
    display: flex; flex-direction: column; align-items: center; gap: 12px;
  }
  .pro-return-card h1 {
    font-family: var(--font-wordmark), system-ui, sans-serif;
    font-weight: 600; letter-spacing: -0.02em; line-height: 1.15;
    font-size: 26px; margin: 0; text-wrap: balance;
  }
  .pro-return-card p {
    margin: 0; color: rgba(255,255,255,0.58); font-size: 15px; line-height: 1.6;
  }
  .pro-return-card .pro-return-strong { color: rgba(255,255,255,0.86); }
  .pro-return-card .pro-return-muted { font-size: 13px; color: rgba(255,255,255,0.5); }
  .pro-return-card a:not(.pro-return-button) { color: rgba(255,255,255,0.86); text-underline-offset: 3px; }
  .pro-return-order {
    width: 100%; margin-top: 4px; padding: 14px 16px; border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03);
    display: flex; flex-direction: column; gap: 6px;
  }
  .pro-return-order code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14px;
    color: rgba(255,255,255,0.92); letter-spacing: 0.02em; user-select: all; word-break: break-all;
  }
  .pro-return-button {
    margin-top: 8px; display: inline-flex; justify-content: center; align-items: center;
    min-width: 200px; border-radius: 12px; padding: 13px 18px; border: 0;
    background: #f0ede6; color: #1d1c19; text-decoration: none; cursor: pointer;
    font: inherit; font-weight: 650; transition: transform 0.16s ease;
  }
  .pro-return-button:hover { transform: translateY(-2px); }
  .pro-return-link {
    margin-top: 2px; border: 0; background: none; padding: 4px; cursor: pointer;
    font: inherit; font-size: 13px; color: rgba(255,255,255,0.7);
    text-decoration: underline; text-underline-offset: 3px;
  }
  .pro-return-spinner {
    width: 22px; height: 22px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.18); border-top-color: rgba(255,255,255,0.75);
    animation: pro-return-spin 0.8s linear infinite;
  }
  @keyframes pro-return-spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { .pro-return-spinner { animation: none; } }
  .pro-return-banner {
    margin: 0; padding: 14px 20px; text-align: center; font-size: 14px;
    color: rgba(255,255,255,0.72); border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .pro-return-banner strong { color: rgba(255,255,255,0.92); }
`;
