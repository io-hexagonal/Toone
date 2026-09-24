"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type FormEvent, type KeyboardEvent, type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import AuthPage from "@/components/AuthPage";
import { Link } from "@/lib/navigation";
import { ApiError, logout, type ApiErrorDetail, type ToneSession } from "@/lib/api";
import { useStoredSession } from "@/lib/hooks/useStoredSession";
import {
  LIMITS, MAX_TAGS, buildSaveRequest, editCoverUrl, formFromEdit, getListingEdit, getPublicTaxonomy,
  groupErrorDetails, isEditDirty, isListingRef, normalizeTag, parseListingKind, publicListingPath,
  saveListingEdit, tagProblem,
  type ExploreListingEdit, type ListingEditForm, type ListingEditRef, type ListingKind, type ListingProfileFull,
} from "@/lib/explore/admin";
import { CoverEncodeError, encodeCoverImage } from "@/lib/explore/coverEncode";
import type { ExploreClassification, ExploreTaxonomy, TaxonomyTerm } from "@/lib/explore/taxonomy";
import shell from "@/components/InvitationAdminPage.module.css";
import s from "./ListingEditPage.module.css";

/* ---------------------------------------------------------------- entry */

export default function ListingEditPage() {
  const params = useSearchParams();
  const kind = parseListingKind(params.get("kind"));
  const id = params.get("id");
  const { session, ready, setSession, endSession } = useStoredSession();
  if (!ready) return <main className={shell.page}><p role="status">Checking your account…</p></main>;
  if (!session) return <AuthPage mode="signin" onAuthenticated={setSession} />;
  if (!kind || !isListingRef(id)) return (
    <main className={`${shell.page} ${shell.restricted}`}>
      <h1>Choose a listing to edit</h1>
      <p>Open a routine or bundle on Explore and use “Edit listing”.</p>
      <Link href="/explore">Go to Explore</Link>
    </main>
  );
  return <EditorWorkspace key={`${session.token}:${kind}:${id}`} session={session} kind={kind} id={id} onSessionEnded={endSession} />;
}

/* ---------------------------------------------------------------- workspace */

type LoadState = "loading" | "ready" | "denied" | "missing" | "failed";
type Notice =
  | { kind: "saved" }
  | { kind: "conflict"; message: string }
  | { kind: "invalid"; message: string; unmatched: ApiErrorDetail[]; count: number }
  | { kind: "error"; message: string };

const ErrorsContext = createContext<ReadonlyMap<string, string[]>>(new Map());

function EditorWorkspace({ session, kind, id, onSessionEnded }: {
  session: ToneSession; kind: ListingKind; id: string; onSessionEnded: () => void;
}) {
  const [state, setState] = useState<LoadState>("loading");
  const [edit, setEdit] = useState<ExploreListingEdit | null>(null);
  const [form, setForm] = useState<ListingEditForm | null>(null);
  const [taxonomy, setTaxonomy] = useState<ExploreTaxonomy | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ReadonlyMap<string, string[]>>(new Map());
  const [signingOut, setSigningOut] = useState(false);
  const active = useRef(true);
  const formRef = useRef<HTMLFormElement>(null);

  const load = useCallback(async () => {
    setState("loading"); setNotice(null); setFieldErrors(new Map());
    try {
      const result = await getListingEdit(session.token, kind, id);
      if (!active.current) return;
      setEdit(result); setForm(formFromEdit(result)); setState("ready");
    } catch (caught) {
      if (!active.current) return;
      if (caught instanceof ApiError && caught.status === 401) onSessionEnded();
      else if (caught instanceof ApiError && caught.status === 403) setState("denied");
      else if (caught instanceof ApiError && caught.status === 404) setState("missing");
      else setState("failed");
    }
  }, [session.token, kind, id, onSessionEnded]);

  useEffect(() => {
    active.current = true;
    void load();
    const controller = new AbortController();
    getPublicTaxonomy(controller.signal).then(value => { if (active.current) setTaxonomy(value); }).catch(() => {});
    return () => { active.current = false; controller.abort(); };
  }, [load]);

  const dirty = !!edit && !!form && isEditDirty(edit, form);

  useEffect(() => {
    document.title = state === "denied" ? "Page not found | Toone" : state === "ready" ? "Edit listing | Toone" : "Account | Toone";
  }, [state]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const update = useCallback((change: (current: ListingEditForm) => ListingEditForm) => {
    setForm(current => current ? change(current) : current);
    setNotice(previous => previous?.kind === "saved" ? null : previous);
  }, []);
  const updateProfile = useCallback((change: (profile: ListingProfileFull) => ListingProfileFull) => {
    update(current => current.profile ? { ...current, profile: change(current.profile) } : current);
  }, [update]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!edit || !form || saving || !dirty) return;
    setSaving(true); setNotice(null); setFieldErrors(new Map());
    try {
      const result = await saveListingEdit(session.token, kind, id, buildSaveRequest(edit, form));
      if (!active.current) return;
      setEdit(result); setForm(formFromEdit(result)); setNotice({ kind: "saved" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      if (!active.current) return;
      if (caught instanceof ApiError && caught.status === 401) { onSessionEnded(); return; }
      if (caught instanceof ApiError && caught.status === 403) { setState("denied"); return; }
      if (caught instanceof ApiError && caught.status === 409) {
        setNotice({ kind: "conflict", message: caught.message || "This listing changed since you opened it. Reload to edit the latest version." });
      } else if (caught instanceof ApiError && (caught.status === 400 || caught.status === 422)) {
        const known = new Set(Array.from(formRef.current?.querySelectorAll<HTMLElement>("[data-field-path]") ?? [], el => el.dataset.fieldPath ?? ""));
        const { fields, unmatched } = groupErrorDetails(caught.details, known);
        setFieldErrors(fields);
        setNotice({ kind: "invalid", message: caught.message || "Some fields need attention.", unmatched, count: fields.size });
        requestAnimationFrame(() => {
          const first = formRef.current?.querySelector<HTMLElement>("[data-invalid='true']");
          first?.scrollIntoView({ behavior: "smooth", block: "center" });
          first?.querySelector<HTMLElement>("input, textarea, select")?.focus({ preventScroll: true });
        });
      } else if (caught instanceof ApiError && caught.status === 404) {
        setNotice({ kind: "error", message: "This listing is no longer live, so it can’t be edited." });
      } else {
        setNotice({ kind: "error", message: "Could not save. Check your connection and try again; nothing was changed if this persists." });
      }
      if (caught instanceof ApiError && caught.status !== 400 && caught.status !== 422) window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      if (active.current) setSaving(false);
    }
  }

  function reload() {
    if (dirty && !window.confirm("Reload the latest version? Your unsaved changes will be lost.")) return;
    void load();
  }

  function discard() {
    if (!edit) return;
    setForm(formFromEdit(edit)); setFieldErrors(new Map()); setNotice(null);
  }

  async function signOut() {
    setSigningOut(true);
    await logout(session.token);
    onSessionEnded();
  }

  if (state === "denied") return (
    <main className={`${shell.page} ${shell.restricted}`}>
      <h1>Page not found</h1>
      <p>The page you’re looking for is unavailable.</p>
      <Link href="/">Return to Toone</Link>
    </main>
  );
  if (state === "missing") return (
    <main className={`${shell.page} ${shell.restricted}`}>
      <h1>This listing isn’t live</h1>
      <p>Only approved, published routines and bundles can be edited here.</p>
      <Link href="/explore">Go to Explore</Link>
    </main>
  );
  if (state !== "ready" || !edit || !form) return (
    <main className={`${shell.page} ${shell.restricted}`}>
      {state === "loading" ? <p role="status">Loading the listing…</p> : <>
        <p role="alert">Could not load this listing. Please try again.</p>
        <button onClick={() => void load()}>Try again</button>
      </>}
    </main>
  );

  const profile = form.profile;
  const publicPath = publicListingPath(edit);
  const displayTitle = edit.listing_profile?.search.display_title || edit.title;
  const sections = [
    ["basics", "Basics"], ...(form.classification ? [["classification", "Classification"]] : []), ["tags-cover", "Tags and cover"],
    ...(profile ? [
      ["results", "Results"], ["you-provide", "You provide"], ["how-it-works", "How it works"],
      ["use-cases", "Use cases"], ["control", "Stays in your control"], ["for-whom", "Who it’s for"],
      ["time", "Time and effort"], ["faq", "FAQ"],
      ...(profile.customization.length ? [["customization", "Customization"]] : []),
      ...(profile.third_parties.length ? [["third-parties", "Third parties"]] : []),
    ] : []),
    ["save", "Save"],
  ] as [string, string][];

  return (
    <main className={shell.page}>
      <div className={shell.container}>
        <header className={shell.header}>
          <Link href="/" className={shell.brand} aria-label="Toone">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/brand/toone-mark.svg" alt="" width={26} height={26} />toone
          </Link>
          <div className={shell.account}><span>{session.user.email}</span><button onClick={() => void signOut()} disabled={signingOut}>{signingOut ? "Signing out…" : "Sign out"}</button></div>
        </header>

        <div className={s.title}>
          <p className={shell.eyebrow}>Explore · {kind === "routine" ? "Routine" : "Bundle"}</p>
          <h1>Edit listing</h1>
          <p className={s.subtitle}>
            <span>{displayTitle}</span>
            <Link href={publicPath} className={s.inlineLink}>View public page ↗</Link>
          </p>
        </div>

        <NoticeBanner notice={notice} publicPath={publicPath} onReload={reload} onDismiss={() => setNotice(null)} />

        <div className={s.layout}>
          <nav className={s.toc} aria-label="Sections">
            <ol>{sections.map(([anchor, label]) => <li key={anchor}><a href={`#${anchor}`}>{label}</a></li>)}</ol>
          </nav>

          <ErrorsContext.Provider value={fieldErrors}>
            <form ref={formRef} className={s.form} onSubmit={save} noValidate>
              <Section id="basics" title="Basics" hint="What people see first: the heading, the card and search result, and the description.">
                {profile ? <>
                  <Field path="listing_profile.search.display_title" label="Title" hint="The page heading and card title." max={LIMITS.displayTitle}
                    value={profile.search.display_title} onChange={value => updateProfile(p => ({ ...p, search: { ...p.search, display_title: value } }))} />
                  <Field path="listing_profile.search.meta_description" label="Short description" hint="The card summary on Explore and the search result snippet." multiline rows={3}
                    min={LIMITS.metaDescription[0]} max={LIMITS.metaDescription[1]}
                    value={profile.search.meta_description} onChange={value => updateProfile(p => ({ ...p, search: { ...p.search, meta_description: value } }))} />
                  <Field path="listing_profile.answer" label="Description" hint="The paragraph under the page heading." multiline rows={5}
                    min={LIMITS.answer[0]} max={LIMITS.answer[1]}
                    value={profile.answer} onChange={value => updateProfile(p => ({ ...p, answer: value }))} />
                  <div className={s.pair}>
                    <Field path="listing_profile.search.seo_title" label="SEO title" hint="The browser tab and search result title." max={LIMITS.seoTitle}
                      value={profile.search.seo_title} onChange={value => updateProfile(p => ({ ...p, search: { ...p.search, seo_title: value } }))} />
                    <Field path="listing_profile.search.job_statement" label="Job statement" hint="The job in plain words, used for search." max={LIMITS.jobStatement}
                      value={profile.search.job_statement} onChange={value => updateProfile(p => ({ ...p, search: { ...p.search, job_statement: value } }))} />
                  </div>
                  <dl className={s.reference}>
                    <div><dt>Catalog title</dt><dd>{edit.title || "—"}</dd></div>
                    <div><dt>Catalog summary</dt><dd>{edit.summary || "—"}</dd></div>
                  </dl>
                  <small className={s.referenceNote}>The catalog title and summary are kept as they are: with a listing profile, pages and cards use the fields above.</small>
                </> : <>
                  <p className={s.note}>This listing was published before listing profiles, so its page shows this title and description. Page sections (results, how it works, FAQ…) arrive with a new revision that has a listing profile.</p>
                  <Field path="title" label="Title" hint="The page heading and card title." max={LIMITS.title}
                    value={form.title} onChange={title => update(current => ({ ...current, title }))} />
                  <Field path="summary" label="Short description" hint="The card summary and the text under the page heading." multiline rows={5} max={LIMITS.summary}
                    value={form.summary} onChange={summary => update(current => ({ ...current, summary }))} />
                </>}
              </Section>

              {form.classification && <Section id="classification" title="Classification" hint="Where the listing appears in Explore’s filters.">
                <ClassificationEditor
                  value={form.classification} taxonomy={taxonomy}
                  onChange={classification => update(current => ({ ...current, classification }))} />
              </Section>}

              <Section id="tags-cover" title="Tags and cover" hint="Tags and the cover change only this listing’s presentation, never the reviewed routine.">
                <TagInput kind={kind} tags={form.tags} onChange={tags => update(current => ({ ...current, tags }))} />
                <CoverEditor edit={edit} dataUrl={form.coverDataUrl} alt={profile?.cover_alt ?? ""}
                  onChange={coverDataUrl => update(current => ({ ...current, coverDataUrl }))} />
                {profile && <Field path="listing_profile.cover_alt" label="Cover alt text" hint="Describes the cover for screen readers and search." max={LIMITS.coverAlt}
                  value={profile.cover_alt} onChange={value => updateProfile(p => ({ ...p, cover_alt: value }))} />}
              </Section>

              {profile && <ProfileSections profile={profile} edit={edit} classification={form.classification} taxonomy={taxonomy} updateProfile={updateProfile} />}

              <Section id="save" title="Save" hint="Saving updates the public page and the desktop app within a minute.">
                <Field path="reason" label="Reason" optional hint="Kept in the audit log." multiline rows={2} max={LIMITS.reason}
                  value={form.reason} onChange={reason => update(current => ({ ...current, reason }))} />
              </Section>

              <div className={s.saveBar}>
                <p role="status" className={s.saveStatus}>
                  {saving ? "Saving…" : dirty ? "Unsaved changes" : notice?.kind === "saved" ? "All changes saved" : "No changes"}
                </p>
                <div className={s.saveActions}>
                  {dirty && !saving && <button type="button" onClick={discard}>Discard</button>}
                  <button type="submit" className={s.saveButton} disabled={!dirty || saving}>{saving ? "Saving…" : "Save changes"}</button>
                </div>
              </div>
            </form>
          </ErrorsContext.Provider>
        </div>
      </div>
    </main>
  );
}

function NoticeBanner({ notice, publicPath, onReload, onDismiss }: {
  notice: Notice | null; publicPath: string; onReload: () => void; onDismiss: () => void;
}) {
  if (!notice) return null;
  if (notice.kind === "saved") return (
    <div className={`${s.banner} ${s.bannerSuccess}`} role="status">
      <p><strong>Saved.</strong> The public page refreshes within a minute.</p>
      <div><Link href={publicPath} className={s.inlineLink}>View public page →</Link></div>
    </div>
  );
  if (notice.kind === "conflict") return (
    <div className={`${s.banner} ${s.bannerError}`} role="alert">
      <p><strong>Someone else changed this listing.</strong> {notice.message}</p>
      <div><button type="button" onClick={onReload}>Reload</button></div>
    </div>
  );
  if (notice.kind === "invalid") return (
    <div className={`${s.banner} ${s.bannerError}`} role="alert">
      <div>
        <p><strong>{notice.message}</strong>{notice.count > 0 ? ` ${notice.count} field${notice.count === 1 ? "" : "s"} marked below.` : ""}</p>
        {notice.unmatched.length > 0 && <ul className={s.detailList}>
          {notice.unmatched.map((detail, index) => <li key={index}><code>{detail.path || "request"}</code> {detail.instruction || detail.rule}</li>)}
        </ul>}
      </div>
      <div><button type="button" onClick={onDismiss}>Dismiss</button></div>
    </div>
  );
  return (
    <div className={`${s.banner} ${s.bannerError}`} role="alert">
      <p>{notice.message}</p>
      <div><button type="button" onClick={onDismiss}>Dismiss</button></div>
    </div>
  );
}

/* ---------------------------------------------------------------- profile sections */

function ProfileSections({ profile, edit, classification, taxonomy, updateProfile }: {
  profile: ListingProfileFull;
  edit: ExploreListingEdit;
  classification: ExploreClassification | null;
  taxonomy: ExploreTaxonomy | null;
  updateProfile: (change: (profile: ListingProfileFull) => ListingProfileFull) => void;
}) {
  const set = <K extends keyof ListingProfileFull>(key: K) => (value: ListingProfileFull[K]) =>
    updateProfile(p => ({ ...p, [key]: value }));
  const audiences = classification?.useful_for_ids ?? edit.refs.useful_for_ids;
  return <>
    <Section id="results" title="Results" hint="What people get when the routine finishes.">
      <ListEditor path="listing_profile.results" items={profile.results} onChange={set("results")}
        min={LIMITS.results.min} max={LIMITS.results.max} noun="result"
        make={() => ({ artefact_id: null, name: "", description: "", format_label: "" })}
        render={(item, index, change) => {
          const at = `listing_profile.results[${index}]`;
          return <>
            <div className={s.pair}>
              <Field path={`${at}.name`} label="Name" max={LIMITS.results.name} value={item.name} onChange={name => change({ ...item, name })} />
              <Field path={`${at}.format_label`} label="Format" max={LIMITS.results.formatLabel} value={item.format_label} onChange={format_label => change({ ...item, format_label })} />
            </div>
            <Field path={`${at}.description`} label="Description" multiline rows={2} max={LIMITS.results.description} value={item.description} onChange={description => change({ ...item, description })} />
            <RefSelect path={`${at}.artefact_id`} label="Linked artefact" refs={edit.refs.artefacts} value={item.artefact_id} onChange={artefact_id => change({ ...item, artefact_id })} />
          </>;
        }} />
    </Section>

    <Section id="you-provide" title="You provide" hint="What people need to supply before a run.">
      <ListEditor path="listing_profile.you_provide" items={profile.you_provide} onChange={set("you_provide")}
        min={LIMITS.youProvide.min} max={LIMITS.youProvide.max} noun="input"
        make={() => ({ input_id: null, label: "", description: "", example: "" })}
        render={(item, index, change) => {
          const at = `listing_profile.you_provide[${index}]`;
          return <>
            <div className={s.pair}>
              <Field path={`${at}.label`} label="Label" max={LIMITS.youProvide.label} value={item.label} onChange={label => change({ ...item, label })} />
              <RefSelect path={`${at}.input_id`} label="Linked input" refs={edit.refs.inputs} value={item.input_id} onChange={input_id => change({ ...item, input_id })} />
            </div>
            <Field path={`${at}.description`} label="Description" multiline rows={2} max={LIMITS.youProvide.description} value={item.description} onChange={description => change({ ...item, description })} />
            <Field path={`${at}.example`} label="Example" optional max={LIMITS.youProvide.example} value={item.example} onChange={example => change({ ...item, example })} />
          </>;
        }} />
    </Section>

    <Section id="how-it-works" title="How it works" hint="The steps in plain words, in order.">
      <StringList path="listing_profile.how_it_works" items={profile.how_it_works} onChange={set("how_it_works")} limits={LIMITS.howItWorks} noun="step" />
    </Section>

    <Section id="use-cases" title="Use cases" hint="Situations where this helps.">
      <StringList path="listing_profile.use_cases" items={profile.use_cases} onChange={set("use_cases")} limits={LIMITS.useCases} noun="use case" multiline />
    </Section>

    <Section id="control" title="Stays in your control" hint="What the routine never does on its own.">
      <StringList path="listing_profile.stays_in_your_control" items={profile.stays_in_your_control} onChange={set("stays_in_your_control")} limits={LIMITS.staysInYourControl} noun="line" />
    </Section>

    <Section id="for-whom" title="Who it’s for" hint="Each audience must be one of the classification’s Useful for choices.">
      <ListEditor path="listing_profile.for_whom" items={profile.for_whom} onChange={set("for_whom")}
        min={LIMITS.forWhom.min} max={LIMITS.forWhom.max} noun="audience"
        make={() => ({ useful_for_id: audiences.find(a => !profile.for_whom.some(f => f.useful_for_id === a)) ?? audiences[0] ?? "", why: "" })}
        render={(item, index, change) => {
          const at = `listing_profile.for_whom[${index}]`;
          const stale = !!item.useful_for_id && !audiences.includes(item.useful_for_id);
          return <>
            <SelectField path={`${at}.useful_for_id`} label="Audience" value={item.useful_for_id}
              warning={stale ? "Not in the classification’s Useful for any more. Pick another or add it above." : undefined}
              options={[...(stale || !item.useful_for_id ? [{ value: item.useful_for_id, label: item.useful_for_id ? `${termName(taxonomy, item.useful_for_id)} (not selected)` : "Choose an audience" }] : []),
                ...audiences.map(a => ({ value: a, label: termName(taxonomy, a) }))]}
              onChange={useful_for_id => change({ ...item, useful_for_id })} />
            <Field path={`${at}.why`} label="Why it helps" multiline rows={2} max={LIMITS.forWhom.why} value={item.why} onChange={why => change({ ...item, why })} />
          </>;
        }} />
    </Section>

    <Section id="time" title="Time and effort">
      <Field path="listing_profile.time_and_effort.you_prepare" label="You prepare" max={LIMITS.youPrepare}
        value={profile.time_and_effort.you_prepare} onChange={you_prepare => updateProfile(p => ({ ...p, time_and_effort: { ...p.time_and_effort, you_prepare } }))} />
      <Field path="listing_profile.time_and_effort.run_estimate" label="Run estimate" max={LIMITS.runEstimate}
        value={profile.time_and_effort.run_estimate} onChange={run_estimate => updateProfile(p => ({ ...p, time_and_effort: { ...p.time_and_effort, run_estimate } }))} />
    </Section>

    <Section id="faq" title="FAQ">
      <ListEditor path="listing_profile.faq" items={profile.faq} onChange={set("faq")}
        min={LIMITS.faq.min} max={LIMITS.faq.max} noun="question"
        make={() => ({ question: "", answer: "" })}
        render={(item, index, change) => {
          const at = `listing_profile.faq[${index}]`;
          return <>
            <Field path={`${at}.question`} label="Question" max={LIMITS.faq.question} value={item.question} onChange={question => change({ ...item, question })} />
            <Field path={`${at}.answer`} label="Answer" multiline rows={3} max={LIMITS.faq.answer} value={item.answer} onChange={answer => change({ ...item, answer })} />
          </>;
        }} />
    </Section>

    {profile.customization.length > 0 && <Section id="customization" title="Customization" hint="Wording only; what each point controls is fixed by the routine.">
      <ListEditor path="listing_profile.customization" items={profile.customization} onChange={set("customization")} min={0} max={profile.customization.length} noun="point"
        render={(item, index, change) => {
          const at = `listing_profile.customization[${index}]`;
          return <>
            <p className={s.meta}>{item.kind}{item.target ? ` · ${item.target}` : ""}</p>
            <Field path={`${at}.label`} label="Label" max={LIMITS.customization.label} value={item.label} onChange={label => change({ ...item, label })} />
            <div className={s.pair}>
              <Field path={`${at}.default`} label="Default" optional max={LIMITS.customization.text} value={item.default} onChange={value => change({ ...item, default: value })} />
              <Field path={`${at}.allowed`} label="Allowed" optional max={LIMITS.customization.text} value={item.allowed} onChange={allowed => change({ ...item, allowed })} />
            </div>
            <Field path={`${at}.note`} label="Note" optional max={LIMITS.customization.text} value={item.note} onChange={note => change({ ...item, note })} />
          </>;
        }} />
    </Section>}

    {profile.third_parties.length > 0 && <Section id="third-parties" title="Third parties" hint="Sites and tools the routine works with. Addresses and actions are fixed.">
      <ListEditor path="listing_profile.third_parties" items={profile.third_parties} onChange={set("third_parties")} min={0} max={profile.third_parties.length} noun="site"
        render={(item, index, change) => {
          const at = `listing_profile.third_parties[${index}]`;
          return <>
            <p className={s.meta}>{item.domain} · {item.actions.join(", ")} · {item.cost}</p>
            <div className={s.pair}>
              <Field path={`${at}.name`} label="Name" max={LIMITS.thirdParties.name} value={item.name} onChange={name => change({ ...item, name })} />
              <Field path={`${at}.note`} label="Note" optional max={LIMITS.thirdParties.note} value={item.note} onChange={note => change({ ...item, note })} />
            </div>
          </>;
        }} />
    </Section>}
  </>;
}

/* ---------------------------------------------------------------- classification */

function termName(taxonomy: ExploreTaxonomy | null, id: string) {
  const label = taxonomy?.terms.find(term => term.id === id)?.label;
  return label ?? id.replace(/^(cat|topic|role)_/, "").replaceAll("-", " ");
}

/** Active terms of one kind in taxonomy order, plus any selected id the taxonomy lacks. */
function termsOf(taxonomy: ExploreTaxonomy | null, kind: TaxonomyTerm["kind"], selected: string[]) {
  const terms = (taxonomy?.terms ?? []).filter(term => term.kind === kind && term.active).sort((a, b) => a.sort_order - b.sort_order);
  const known = new Set(terms.map(term => term.id));
  return [...terms.map(term => ({ id: term.id, label: term.label, description: term.description })),
    ...selected.filter(id => !known.has(id)).map(id => ({ id, label: termName(taxonomy, id), description: "" }))];
}

function ClassificationEditor({ value, taxonomy, onChange }: {
  value: ExploreClassification; taxonomy: ExploreTaxonomy | null; onChange: (value: ExploreClassification) => void;
}) {
  const categories = termsOf(taxonomy, "category", value.category_id ? [value.category_id] : []);
  return <>
    {!taxonomy && <p className={s.meta}>Loading the taxonomy… Current choices are shown by id.</p>}
    <SelectField path="classification.category_id" label="Category" value={value.category_id}
      options={categories.map(term => ({ value: term.id, label: term.label }))}
      onChange={category_id => onChange({ ...value, category_id })} />
    <ChipGroup path="classification.topic_ids" label="Topics" range={LIMITS.topics}
      terms={termsOf(taxonomy, "topic", value.topic_ids)} selected={value.topic_ids}
      onChange={topic_ids => onChange({ ...value, topic_ids })} />
    <ChipGroup path="classification.useful_for_ids" label="Useful for" range={LIMITS.usefulFor}
      terms={termsOf(taxonomy, "useful_for", value.useful_for_ids)} selected={value.useful_for_ids}
      onChange={useful_for_ids => onChange({ ...value, useful_for_ids })} />
  </>;
}

function ChipGroup({ path, label, range, terms, selected, onChange }: {
  path: string; label: string; range: readonly [number, number];
  terms: { id: string; label: string; description: string }[]; selected: string[]; onChange: (ids: string[]) => void;
}) {
  const errors = useFieldErrors(path);
  const full = selected.length >= range[1];
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter(item => item !== id) : [...selected, id]);
  return (
    <fieldset className={s.field} data-field-path={path} data-invalid={errors.length > 0 || undefined}>
      <legend className={s.labelRow}><span>{label}</span><span className={s.counter} data-warn={selected.length < range[0] || undefined}>{selected.length} of {range[0]}–{range[1]}</span></legend>
      <div className={s.chips}>
        {terms.map(term => {
          const on = selected.includes(term.id);
          return (
            <label key={term.id} className={s.chip} data-on={on || undefined} title={term.description || undefined}>
              <input type="checkbox" checked={on} disabled={!on && full} onChange={() => toggle(term.id)} />
              {term.label}
            </label>
          );
        })}
      </div>
      <FieldErrors errors={errors} />
    </fieldset>
  );
}

/* ---------------------------------------------------------------- tags + cover */

function TagInput({ kind, tags, onChange }: { kind: ListingKind; tags: string[]; onChange: (tags: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const [problem, setProblem] = useState("");
  const errors = useFieldErrors("tags");
  const full = tags.length >= MAX_TAGS;

  function commit(raw: string) {
    const parts = raw.split(",").map(part => normalizeTag(part, kind)).filter(Boolean);
    const next = [...tags];
    for (const tag of parts) {
      const issue = tagProblem(tag, kind);
      if (issue) { setProblem(`“${tag}”: ${issue}`); return; }
      if (next.includes(tag)) continue;
      if (next.length >= MAX_TAGS) { setProblem(`Use at most ${MAX_TAGS} tags.`); break; }
      next.push(tag);
    }
    onChange(next); setDraft(""); if (next.length < MAX_TAGS || parts.length === 0) setProblem("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") { event.preventDefault(); if (draft.trim()) commit(draft); }
    else if (event.key === "Backspace" && !draft && tags.length) onChange(tags.slice(0, -1));
  }

  return (
    <div className={s.field} data-field-path="tags" data-invalid={errors.length > 0 || undefined}>
      <div className={s.labelRow}><label htmlFor="tag-input">Tags</label><span className={s.counter}>{tags.length} of {MAX_TAGS}</span></div>
      <div className={s.tagBox}>
        {tags.map((tag, index) => (
          <span key={tag} className={s.tag} data-invalid={!!tagProblem(tag, kind) || undefined}>
            {tag}
            <button type="button" aria-label={`Remove tag ${tag}`} onClick={() => onChange(tags.filter((_, i) => i !== index))}>×</button>
          </span>
        ))}
        <input id="tag-input" value={draft} disabled={full} autoComplete="off" spellCheck={false}
          placeholder={full ? "Tag limit reached" : tags.length ? "Add a tag" : "Type a tag and press Enter"}
          onChange={event => { setDraft(event.target.value); setProblem(""); }}
          onKeyDown={onKeyDown} onBlur={() => { if (draft.trim()) commit(draft); }} />
      </div>
      <small>{kind === "bundle" ? "Lowercase letters, digits and hyphens, up to 32 characters." : "Up to 40 characters each."} Press Enter or comma to add.</small>
      {problem && <p className={s.error}>{problem}</p>}
      <FieldErrors errors={errors} />
    </div>
  );
}

function CoverEditor({ edit, dataUrl, alt, onChange }: {
  edit: ExploreListingEdit; dataUrl: string | null; alt: string; onChange: (dataUrl: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const errors = useFieldErrors("cover_image_data_url");
  const current = useMemo(() => editCoverUrl(edit), [edit]);
  const shown = dataUrl ?? current;

  async function choose(file: File | undefined) {
    if (!file) return;
    setBusy(true); setProblem("");
    try { onChange(await encodeCoverImage(file)); }
    catch (caught) { setProblem(caught instanceof CoverEncodeError ? caught.message : "Could not use that image."); }
    finally { setBusy(false); if (input.current) input.current.value = ""; }
  }

  return (
    <div className={s.field} data-field-path="cover_image_data_url" data-invalid={errors.length > 0 || undefined}>
      <div className={s.labelRow}><span>Cover</span>{dataUrl && <span className={s.badge}>New, not saved</span>}</div>
      <div className={s.cover}>
        <div className={s.coverFrame}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {shown ? <img src={shown} alt={alt} /> : <span>No cover</span>}
        </div>
        <div className={s.coverActions}>
          <input ref={input} type="file" accept="image/*" hidden onChange={event => void choose(event.target.files?.[0])} />
          <button type="button" onClick={() => input.current?.click()} disabled={busy}>{busy ? "Preparing…" : shown ? "Replace image…" : "Choose image…"}</button>
          {dataUrl && <button type="button" onClick={() => onChange(null)} disabled={busy}>Keep current cover</button>}
          <small>Cropped to 16:9 and saved as a JPEG under 256 KB.</small>
        </div>
      </div>
      {problem && <p className={s.error} role="alert">{problem}</p>}
      <FieldErrors errors={errors} />
    </div>
  );
}

/* ---------------------------------------------------------------- building blocks */

function useFieldErrors(path: string) {
  return useContext(ErrorsContext).get(path) ?? [];
}

function FieldErrors({ errors }: { errors: string[] }) {
  if (!errors.length) return null;
  return <>{errors.map((error, index) => <p key={index} className={s.error}>{error}</p>)}</>;
}

function Section({ id, title, hint, children }: { id: string; title: string; hint?: string; children: ReactNode }) {
  return (
    <section id={id} className={s.section} aria-labelledby={`${id}-heading`}>
      <header className={s.sectionHead}>
        <h2 id={`${id}-heading`}>{title}</h2>
        {hint && <p>{hint}</p>}
      </header>
      <div className={s.sectionBody}>{children}</div>
    </section>
  );
}

const fieldId = (path: string) => `f-${path.replace(/[^a-zA-Z0-9]+/g, "-")}`;
const runes = (value: string) => Array.from(value).length;

function Field({ path, label, value, onChange, hint, min, max, multiline, rows = 3, optional }: {
  path: string; label: string; value: string; onChange: (value: string) => void;
  hint?: string; min?: number; max?: number; multiline?: boolean; rows?: number; optional?: boolean;
}) {
  const errors = useFieldErrors(path);
  const id = fieldId(path);
  const length = runes(value.trim());
  const warn = (max !== undefined && length > max) || (min !== undefined && length > 0 && length < min) || (!optional && length === 0);
  const describedBy = [hint ? `${id}-hint` : "", errors.length ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;
  const common = {
    id, value, "aria-describedby": describedBy, "aria-invalid": errors.length > 0 || undefined,
    onChange: (event: { target: { value: string } }) => onChange(event.target.value),
  };
  return (
    <div className={s.field} data-field-path={path} data-invalid={errors.length > 0 || undefined}>
      <div className={s.labelRow}>
        <label htmlFor={id}>{label}{optional && <span className={shell.muted}> (optional)</span>}</label>
        {max !== undefined && <span className={s.counter} data-warn={warn || undefined}>{min ? `${length} / ${min}–${max}` : `${length} / ${max}`}</span>}
      </div>
      {multiline ? <textarea {...common} rows={rows} /> : <input {...common} autoComplete="off" />}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
      <div id={`${id}-error`}><FieldErrors errors={errors} /></div>
    </div>
  );
}

function SelectField({ path, label, value, options, onChange, warning }: {
  path: string; label: string; value: string; options: { value: string; label: string }[];
  onChange: (value: string) => void; warning?: string;
}) {
  const errors = useFieldErrors(path);
  const id = fieldId(path);
  return (
    <div className={s.field} data-field-path={path} data-invalid={errors.length > 0 || undefined}>
      <div className={s.labelRow}><label htmlFor={id}>{label}</label></div>
      <select id={id} value={value} onChange={event => onChange(event.target.value)} aria-invalid={errors.length > 0 || undefined}>
        {options.map(option => <option key={option.value || "none"} value={option.value} disabled={!option.value}>{option.label}</option>)}
      </select>
      {warning && <p className={s.warning}>{warning}</p>}
      <FieldErrors errors={errors} />
    </div>
  );
}

/** A declared artefact/input reference; "" in the select is null in the profile. */
function RefSelect({ path, label, refs, value, onChange }: {
  path: string; label: string; refs: ListingEditRef[]; value: string | null; onChange: (value: string | null) => void;
}) {
  const unknown = value && !refs.some(ref => ref.id === value);
  const options = [
    { value: "", label: "Not linked" },
    ...refs.map(ref => ({ value: ref.id, label: ref.name })),
    ...(unknown ? [{ value, label: `${value} (not declared)` }] : []),
  ];
  const errors = useFieldErrors(path);
  const id = fieldId(path);
  return (
    <div className={s.field} data-field-path={path} data-invalid={errors.length > 0 || undefined}>
      <div className={s.labelRow}><label htmlFor={id}>{label}</label></div>
      <select id={id} value={value ?? ""} onChange={event => onChange(event.target.value || null)}>
        {options.map(option => <option key={option.value || "none"} value={option.value}>{option.label}</option>)}
      </select>
      <FieldErrors errors={errors} />
    </div>
  );
}

function ListEditor<T>({ path, items, onChange, min, max, noun, make, render }: {
  path: string; items: T[]; onChange: (items: T[]) => void; min: number; max: number; noun: string;
  make?: () => T; render: (item: T, index: number, change: (next: T) => void) => ReactNode;
}) {
  const errors = useFieldErrors(path);
  const move = (from: number, to: number) => {
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };
  return (
    <div className={s.list} data-field-path={path} data-invalid={errors.length > 0 || undefined}>
      {items.length === 0 ? <p className={s.empty}>No {noun}s yet.</p> : (
        <ol className={s.rows}>
          {items.map((item, index) => <ListRow key={index} path={`${path}[${index}]`} index={index} count={items.length} noun={noun}
            canRemove={items.length > min}
            onMove={to => move(index, to)} onRemove={() => onChange(items.filter((_, i) => i !== index))}>
            {render(item, index, next => onChange(items.map((current, i) => i === index ? next : current)))}
          </ListRow>)}
        </ol>
      )}
      <FieldErrors errors={errors} />
      {make && <div className={s.listFoot}>
        <button type="button" onClick={() => onChange([...items, make()])} disabled={items.length >= max}>+ Add {noun}</button>
        <span className={s.counter}>{items.length} of {min ? `${min}–` : "up to "}{max}</span>
      </div>}
    </div>
  );
}

function ListRow({ path, index, count, noun, canRemove, onMove, onRemove, children }: {
  path: string; index: number; count: number; noun: string; canRemove: boolean;
  onMove: (to: number) => void; onRemove: () => void; children: ReactNode;
}) {
  const errors = useFieldErrors(path);
  return (
    <li className={s.row} data-field-path={path} data-invalid={errors.length > 0 || undefined}>
      <span className={s.rowIndex} aria-hidden="true">{index + 1}</span>
      <div className={s.rowFields}>{children}<FieldErrors errors={errors} /></div>
      <div className={s.rowTools}>
        <button type="button" aria-label={`Move ${noun} ${index + 1} up`} title="Move up" disabled={index === 0} onClick={() => onMove(index - 1)}>↑</button>
        <button type="button" aria-label={`Move ${noun} ${index + 1} down`} title="Move down" disabled={index === count - 1} onClick={() => onMove(index + 1)}>↓</button>
        <button type="button" aria-label={`Remove ${noun} ${index + 1}`} title={canRemove ? "Remove" : "At the minimum"} disabled={!canRemove} onClick={onRemove}>×</button>
      </div>
    </li>
  );
}

function StringList({ path, items, onChange, limits, noun, multiline }: {
  path: string; items: string[]; onChange: (items: string[]) => void;
  limits: { min: number; max: number; length: number }; noun: string; multiline?: boolean;
}) {
  return <ListEditor path={path} items={items} onChange={onChange} min={limits.min} max={limits.max} noun={noun} make={() => ""}
    render={(item, index, change) => <Field path={`${path}[${index}]`} label={`${noun[0].toUpperCase()}${noun.slice(1)} ${index + 1}`}
      max={limits.length} multiline={multiline} rows={2} value={item} onChange={change} />} />;
}
