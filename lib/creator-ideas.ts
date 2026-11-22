/**
 * Ideas shown to creators on /creators/join and /creators, each with its own
 * page at /creators/ideas/{slug}. Every idea is something Toone already runs.
 * Add an idea here and it appears on every creator page. English only.
 */

export type CreatorIdeaLink = { label: string; href: string };

/**
 * A prompt to paste into a new Toone conversation. Toone builds the routine
 * from it and asks for anything it could not fill (the setup questions are
 * named in the prompt, never hard-coded values), the way setup from Explore works.
 */
export type CreatorIdeaPrompt = { label: string; text: string };

export type CreatorIdea = {
  slug: string;
  /** Short name on the card. */
  label: string;
  /** Illustration under public/, 16:9. */
  image: string;
  title: string;
  summary: string;
  /** The working example ("Case study: Tube of Ideas"), when there is one to name. */
  example?: { name: string; text: string };
  /** What the routines do, high level. */
  steps: string[];
  /** A starting point for a video or post about it. */
  showYourAudience: string;
  links: CreatorIdeaLink[];
  /** One or more setup prompts; more than one when the idea has several routines. */
  prompts: CreatorIdeaPrompt[];
};

export const CREATOR_IDEAS: readonly CreatorIdea[] = [
  {
    slug: "self-improving-youtube-channel",
    image: "/assets/creators/idea-youtube.webp",
    label: "Self-improving YouTube channel",
    title: "A YouTube channel that gets better with every review",
    summary:
      "Toone researches what to make, drafts and edits each video with Claude, and turns every review note into a rule the next video follows.",
    example: {
      name: "Case study: Tube of Ideas, with Chip & Mo",
      text:
        "Tube of Ideas is a Shorts channel hosted by two characters, Chip and Mo. Toone runs the research, the scripts, the edit and the review. Each note left on a video goes into the channel's playbook, so the channel's voice and intent sharpen with every review. The Chip & Mo playbook is on its 41st version.",
    },
    steps: [
      "Research: Toone finds topics that fit the channel and checks the facts behind them.",
      "Make: Claude writes, edits and reviews each video against the channel's playbook.",
      "Improve: you leave remarks on a review page Toone keeps updated, and each remark becomes a playbook rule, so the same note is never needed twice.",
    ],
    showYourAudience: "Show one video next to the review note that changed the next one.",
    links: [{ label: "Watch Tube of Ideas", href: "https://www.youtube.com/@TubeofIdeas" }],
    prompts: [
      {
        label: "Self-improving YouTube channel",
        text: `Set up a routine that makes videos for my YouTube channel and gets better from my remarks.

Review page (review.html), where I track every video and polish the channel with my remarks: create it in this project, open it in my browser and keep it updated after every run. It lists each run's videos with a player, and every video has a form where I give a verdict (accept, polish or drop), a score from 1 to 10 and notes pinned to a moment in the video. I can save a draft and press Send when I am done. Save every remark as a file in this project. The page also shows, under each remark, whether you have read it and what you changed because of it.

During setup, ask me for: the channel and its audience, the format (Shorts or long-form), how many videos a week, the topics it covers and the ones to avoid, and the editing tools I have connected.

Each run:
1. Read only the remarks I sent since the last run, and mark them read on the page.
2. Turn each remark into a rule in a channel playbook kept as a versioned file in this project. If a remark contradicts an existing rule, ask me which one wins. Write your answer back on the page next to the remark: what changed and in which run.
3. Research topics that fit the channel. Check every claim against at least two sources and keep the sources with the topic.
4. Write each script against the current playbook: hook, structure, length and voice.
5. Assemble each video with my editing tools, then have Claude review the cut against the playbook and the facts, and fix what fails before it reaches me.
6. Add the new videos to the review page with their title, description and thumbnail, and open a section at the top called "What changed since your last remarks".

Rules: never upload or schedule a video I have not accepted on the page. Never apply the same remark twice. End each run with a short report of what was made, what was skipped and why.

Schedule: daily. Ask me for the time.`,
      },
    ],
  },
  {
    slug: "reddit-watcher",
    image: "/assets/creators/idea-reddit.webp",
    label: "Outreach: Reddit watcher",
    title: "Reddit watcher: find the people already asking for you",
    summary:
      "Toone watches the communities you pick for new posts where people ask for a tip or a tool you can help with, and drafts a reply in your voice.",
    steps: [
      "Watch: Toone reads new posts in the subreddits you choose, on a schedule.",
      "Pick: it keeps the posts where your answer would help and checks each community's rules.",
      "Reply: it drafts the answer in your voice; you decide what gets posted.",
    ],
    showYourAudience: "Show a week of matched posts and the replies that started real conversations.",
    links: [],
    prompts: [
      {
        label: "Reddit watcher",
        text: `Set up a routine that watches Reddit for people asking for what I offer and drafts replies for me to approve.

Radar page (radar.html), where I track every match and polish the replies with my remarks: create it in this project, open it in my browser and keep it open and updated. It lists every matched post with the subreddit, its rules summary, the post and your draft reply. On each draft I can Approve, Skip, or write a remark and ask for a new draft. Show replies to my past comments there too, and how my recent comments did (points, removed or not). Save every approval and remark as a file in this project.

During setup, ask me for: what I offer and the one link I may share, the subreddits to watch (suggest some from my description), the kinds of questions that count as a match, and my voice (I will paste a few of my own comments). Use my Reddit account signed in on Toone's browser.

Every 10 minutes from 08:00 to 23:00, without AI: read the newest posts in those subreddits and the replies to my comments, and update the radar page.

Every hour, or right away when I approve something on the page, with AI:
1. Read my remarks since the last run and apply them to my voice notes and the matching rules, so the same remark is never needed twice. Note on the page what you changed.
2. Keep only the posts where a reply would really help. Read each subreddit's rules first and skip any community that bans links, self-promotion or AI-written text.
3. Draft a reply in my voice that answers the question first. Mention what I offer only when it fits, say that I made it, and add the link only where the rules allow.
4. Post only the replies I approved on the page, exactly as approved.

Limits: at most 10 replies a day, never two in the same subreddit within an hour, and stop for the day if one of my comments is removed. Remember every thread so a post is never answered twice.`,
      },
    ],
  },
  {
    slug: "market-watchers",
    image: "/assets/creators/idea-markets.webp",
    label: "Stock & prediction markets",
    title: "Stock and prediction-market watchers",
    summary:
      "Toone follows the stocks and prediction markets you care about and sends you a short brief when something moves, with the news behind it.",
    example: {
      name: "Two watchers we run",
      text:
        "The stock watcher follows a list of tickers and explains each notable move. The politics watcher follows prediction markets on elections and policy and flags when the odds shift, with what changed.",
    },
    steps: [
      "Follow: you give Toone the tickers or markets to track.",
      "Explain: when a price or the odds move, Toone reads the news and sources behind it.",
      "Brief: you get a short summary on your schedule. Briefs are information, not investment advice.",
    ],
    showYourAudience: "Show a brief from the morning after a big move and how it explained the shift.",
    links: [],
    prompts: [
      {
        label: "Stock watcher",
        text: `Set up a stock watcher that tells me when something I follow moves, and why.

Brief page (briefs.html), where I track every alert and polish the watcher with my remarks: create it in this project, open it in my browser and update it after every run. It shows today's brief on top and past briefs below. Each alert has buttons for Useful, Noise and Wrong reason, plus a remark field. Save every remark as a file in this project, and show under it what you changed because of it.

During setup, ask me for: the tickers to follow, what counts as a notable move (suggest 3% in a day, or a new 52-week high or low), the market data and news sources to use, and where to send the brief (email, Discord, or only the page below).

Every 30 minutes while the market is open: fetch the prices of my tickers with a script, without AI. If nothing crossed a threshold, stop there.

When something did, with AI: read the latest news, filings and earnings notes about that company and explain the move in two or three sentences, with links to the sources.

Every weekday after the close:
1. Read my remarks since the last brief. Adjust the thresholds, sources and wording they point to, and note on the page what you changed.
2. Send one brief and add it to the page: each ticker's day, the notable moves with their reasons, and what is scheduled for tomorrow (earnings, dividends). Keep a history so the brief can say "third day down" instead of repeating itself.

Information only: never place trades and never give buy or sell advice.`,
      },
      {
        label: "Politics watcher",
        text: `Set up a politics watcher that follows prediction markets and tells me when the odds shift.

Odds page (odds.html), where I track every alert and polish the watcher with my remarks: create it in this project, open it in my browser and update it after every check. It shows each market with its current odds and a 7-day line, and every alert below it. Each alert has buttons for Useful, Noise and Wrong reason, plus a remark field. Save every remark as a file in this project, and show under it what you changed because of it.

During setup, ask me for: the markets to follow (I will paste links, or describe the elections and policies and you suggest markets), what counts as a shift (suggest 5 points in 24 hours), and where to send alerts (email, Discord, or only the page below).

Every 15 minutes, with a script and without AI: read the current probability of each market, store it and redraw the page. If no market moved past the threshold, stop there.

When one did, with AI: find what changed (polls, news, statements, court rulings or votes) in at least two reliable sources, and write a short alert with the market, the old and new odds, the likely reason and the links.

Every morning at 08:00:
1. Read my remarks since yesterday. Adjust the thresholds, markets and sources they point to, and note on the page what you changed.
2. Send a digest of all my markets with their 24-hour change.

Information only: never place bets or trades.`,
      },
    ],
  },
];

export function creatorIdea(slug: string): CreatorIdea | null {
  return CREATOR_IDEAS.find((idea) => idea.slug === slug) ?? null;
}
