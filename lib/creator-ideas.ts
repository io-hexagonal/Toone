/**
 * Ideas shown to creators on /creators/join and /creators, each with its own
 * page at /creators/ideas/{slug}, and to people new to Toone on the public,
 * indexed /newcomers/ideas pages. Every idea is something Toone already runs.
 * Add an idea here and it appears on every creator and newcomer page. English only.
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
  /** Copy for the public /newcomers/ideas/{slug} page. */
  newcomer: NewcomerCopy;
};

/** The public, indexed version of an idea, written for someone new to Toone. */
export type NewcomerCopy = {
  /** <title>, under 60 characters, used as is. */
  metaTitle: string;
  /** Meta and social description, under 160 characters. */
  metaDescription: string;
  /** Who the idea is for, in plain words, shown under the summary. */
  forWho: string;
  /** What to have ready before pasting the prompt. */
  needs: string[];
  /** Short questions newcomers ask; also published as FAQPage data. */
  faq: { q: string; a: string }[];
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
    newcomer: {
      metaTitle: "A YouTube channel that improves with every review",
      metaDescription:
        "Toone researches topics, drafts and edits each video with Claude, and turns every review note into a rule the next video follows. You approve every upload.",
      forWho:
        "For anyone starting or running a channel who wants help with research, scripts and edits, and wants the final say on every video.",
      needs: [
        "A Mac with Toone installed.",
        "A short description of your channel, its audience and the topics to avoid.",
        "The editing tools you use, connected in Toone.",
        "Time to review each video on the review page Toone keeps for you.",
      ],
      faq: [
        {
          q: "Does it upload videos on its own?",
          a: "No. A video is uploaded or scheduled only after you accept it on the review page.",
        },
        {
          q: "What happens to my review notes?",
          a: "Each note becomes a rule in the channel's playbook, so you never give the same note twice. The review page shows what changed because of each note.",
        },
        {
          q: "Is there a channel that runs this way?",
          a: "Yes. Tube of Ideas, a Shorts channel hosted by Chip and Mo, runs on it. Its playbook is on its 41st version.",
        },
      ],
    },
  },
  {
    slug: "reddit-watcher",
    image: "/assets/creators/idea-reddit.webp",
    label: "Outreach: Reddit watcher",
    title: "Reddit watcher: find the people already asking for you",
    summary:
      "Toone watches the communities you pick for people asking for a tip or a tool you can help with, drafts replies in your voice for you to approve, and learns from every note and every edit you make.",
    steps: [
      "Watch: scripts read new threads, the replies to your comments and your comments' points every couple of minutes, with no AI. A live page shows them as they come in, and a Fetch now button reads Reddit straight away.",
      "Pick: the AI marks threads Relevant, Maybe or Not relevant, moves the best ones to the top, checks each community's rules and drafts a reply in your voice. A Run AI now button starts it on demand.",
      "Follow up: each reply to your comments gets a short AI breakdown of what it says, its tone and whether it needs an answer.",
      "Post: only the replies you approve go out, word for word, at most 10 a day and never two in the same subreddit within an hour.",
      "Learn: every remark, thumbs up or thumbs down becomes a rule, and every draft you edit is compared with your version, so the next drafts sound more like you.",
    ],
    showYourAudience: "Show the radar page live, one draft next to the version you edited, and the rule the radar learned from that edit.",
    links: [],
    prompts: [
      {
        label: "Reddit watcher",
        text: `Set up a routine that watches Reddit for people asking for what I offer, drafts replies for me to approve, and gets closer to how I write every time I correct it.

Radar page (radar.html): create it in this project, open it in my browser and keep it open and live. Split it in half:
- Left: every new thread fetched from my subreddits. Once the AI has run, the relevant ones move to the top, marked Relevant, Maybe or Not relevant. A relevant thread shows the subreddit, its rules summary, the post and your draft reply in an editable box. On each draft I can Approve (it posts exactly the text in the box, with my edits), Skip, ask for a new draft with a remark, or tell you how to approach threads like this. On any thread I can say "good thread, draft it" or "not our kind of thread", with an optional note.
- Right: the replies to my comments with an AI breakdown (what each one says, its tone, whether it needs my answer and what to say), the replies you have posted, my recent comments with their points and whether they were removed, and an overview: counts, a heatmap of when threads appear by subreddit and hour, relevant threads by subreddit, and my points by subreddit.
- At the top: when the feed was last updated and when the AI last ran, a "Fetch now" button that reads Reddit straight away, a "Run AI now" button, and a Pause posting switch.
Save every click on the page (approval, skip, feedback, run request) as a file in this project. Every button must lead somewhere: whatever checks those files has to recognise every kind of click, including "Run AI now", and never drop one it doesn't know. Test each button once after setup and show me that it worked.

Learning: keep three files in this project, my voice notes, the matching rules (which threads to answer and which to leave) and a playbook (how to approach each kind of thread). Turn every piece of feedback into a rule in the right file, so I never have to say the same thing twice. Show the current rules and what each piece of feedback changed on a Playbook tab.

Learning from my edits: when I change a draft before approving it, save your draft next to the text I approved. On the next AI run, compare the two, name what I changed (length, first line, tone, details I added or cut, how I mentioned what I offer, the ending), and turn whatever would apply to other threads into rules in my voice notes or the playbook. If I keep making the same kind of edit, make that rule stronger. Keep my 10 latest edited pairs in an examples file with one lesson each, and read them before drafting, so new drafts read like my edited versions rather than your first drafts. On the page, show my edits as a highlighted before-and-after on the approved reply and on the Playbook tab.

During setup, ask me for: what I offer and the one link I may share, the subreddits to watch (suggest some from my description), the kinds of questions that count as a match, and my voice (I will paste a few of my own comments). Use my Reddit account signed in on Toone's browser.

Fetching, without AI: keep it running all the time from 08:00 to 23:00, reading the newest posts in those subreddits, the replies to my comments and how my recent comments are doing every couple of minutes, and update the page.

With AI: a quick check with no AI runs every minute from 08:00 to 23:00 and wakes the AI only when there is something to do: an approval, a piece of feedback, an edit, "Run AI now", or new threads and replies once an hour. Then:
1. Apply my feedback and edits since the last run to the voice notes, matching rules and playbook. Note on the page what changed.
2. Sort the new threads into relevant, maybe and not relevant. Keep a thread as relevant only where a reply would really help. Read each subreddit's rules first and skip any community that bans links, self-promotion or AI-written text.
3. Draft a reply in my voice for each relevant thread, following the playbook and my edited examples, that answers the question first. Mention what I offer only when it fits, say that I made it, and add the link only where the rules allow.
4. Break down the new replies to my comments.
5. Post only the replies I approved on the page, exactly as approved. If posting is paused, keep my approvals and post them once I switch it back on.

Limits: at most 10 replies a day, never two in the same subreddit within an hour, and stop for the day if one of my comments is removed. Remember every thread so a post is never answered twice. Tell me only when new drafts are ready, when posting stops, or when Reddit can't be read, and only once per problem.`,
      },
    ],
    newcomer: {
      metaTitle: "Reddit watcher: find people who need what you offer",
      metaDescription:
        "Toone watches the subreddits you pick, finds people asking for what you offer, drafts replies in your voice and posts only the ones you approve.",
      forWho:
        "For anyone with a product, a service or a skill that people ask about on Reddit. You don't need to code. Paste one prompt and Toone builds the watcher with you.",
      needs: [
        "A Mac with Toone installed.",
        "Your Reddit account, signed in on Toone's browser.",
        "One or two sentences on what you offer, and the one link you are happy to share.",
        "A few of your own Reddit comments, so the drafts sound like you.",
      ],
      faq: [
        {
          q: "Does it post anything without asking me?",
          a: "No. It posts only the replies you approve on the radar page, exactly as you approved them. Everything else stays a draft.",
        },
        {
          q: "Will it break subreddit rules?",
          a: "It reads each community's rules before drafting and skips any that ban links, self-promotion or AI-written text. It posts at most 10 replies a day, never two in the same subreddit within an hour, and stops for the day if one of your comments is removed.",
        },
        {
          q: "How does it learn how I write?",
          a: "Every note you leave becomes a rule. When you edit a draft before approving it, Toone compares its draft with your version and applies what you changed to the next drafts, so they need fewer edits over time.",
        },
        {
          q: "Does it use AI all the time?",
          a: "No. Plain scripts read Reddit every couple of minutes, so new threads show up almost at once. The AI runs only when there is work: new threads to sort, a note to apply, an edit to learn from or a reply to post. The page shows when each last ran.",
        },
      ],
    },
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
    newcomer: {
      metaTitle: "Stock and prediction market watchers with AI briefs",
      metaDescription:
        "Toone follows your stocks and prediction markets with plain scripts and sends a short brief with sources when something moves. Information only, never trades.",
      forWho:
        "For anyone who follows a few stocks or prediction markets and wants to know when something moves and why, without watching charts all day.",
      needs: [
        "A Mac with Toone installed.",
        "The tickers or prediction markets you follow.",
        "What counts as a big move for you (Toone suggests a starting point).",
        "Where you want the brief: email, Discord or a page on your Mac.",
      ],
      faq: [
        {
          q: "Does it trade or give investment advice?",
          a: "No. Briefs are information only. It never places trades or bets and never tells you to buy or sell.",
        },
        {
          q: "How often does it check?",
          a: "The stock watcher checks prices every 30 minutes while the market is open, and the politics watcher checks the odds every 15 minutes. Both use plain scripts and wake the AI only when something crosses your threshold.",
        },
        {
          q: "Can I tune what it tells me?",
          a: "Yes. Mark any alert as Useful, Noise or Wrong reason, or leave a note. Toone adjusts its thresholds and sources and shows what it changed.",
        },
      ],
    },
  },
];

export function creatorIdea(slug: string): CreatorIdea | null {
  return CREATOR_IDEAS.find((idea) => idea.slug === slug) ?? null;
}
