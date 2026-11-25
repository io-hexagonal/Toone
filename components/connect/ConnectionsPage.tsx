"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { useStoredSession } from "@/lib/hooks/useStoredSession";
import { connectionLabel, disconnect, formatConnectionDate, listConnections, type Connection } from "@/lib/connect/connections";
import { ConnectSignIn } from "./ConnectPage";
import styles from "./connect.module.css";

type View =
  | { kind: "loading" }
  | { kind: "list"; connections: Connection[]; busy: string | null; notice: string | null }
  | { kind: "error" };

/**
 * The account's connected apps, each with when it was connected, how it acts
 * and a Disconnect button. Disconnecting ends the connection and all its
 * tokens at once; the app has to be connected again on /connect.
 */
export default function ConnectionsPage() {
  const { session, ready, setSession, endSession } = useStoredSession();
  const [view, setView] = useState<View>({ kind: "loading" });
  const token = session?.token ?? null;

  const load = useCallback(async () => {
    if (!token) return;
    setView({ kind: "loading" });
    try {
      setView({ kind: "list", connections: await listConnections(token), busy: null, notice: null });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return endSession();
      setView({ kind: "error" });
    }
  }, [token, endSession]);

  useEffect(() => { void load(); }, [load]);

  async function remove(connection: Connection) {
    if (!token || view.kind !== "list" || view.busy) return;
    if (!window.confirm(`Disconnect ${connectionLabel(connection)}? It loses access to your Toone right away.`)) return;
    setView({ ...view, busy: connection.id, notice: null });
    try {
      await disconnect(token, connection.id);
      setView((current) => current.kind === "list"
        ? { ...current, busy: null, connections: current.connections.filter((item) => item.id !== connection.id), notice: `${connectionLabel(connection)} was disconnected.` }
        : current);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return endSession();
      setView((current) => current.kind === "list" ? { ...current, busy: null, notice: "That didn't work. Try again." } : current);
    }
  }

  if (!ready) return <Shell><p role="status">Checking your account…</p></Shell>;
  if (!session) {
    return <ConnectSignIn sessionEnded={false} onAuthenticated={setSession} />;
  }

  return (
    <Shell>
      <h1>Connected apps</h1>
      <p className={styles.lede}>Apps you allowed to use Toone on your Mac. Disconnect any you don&apos;t recognise or no longer use.</p>
      <p className={styles.account}>Signed in as <strong>{session.user.email}</strong>.</p>
      <div className={styles.stack}>
        {view.kind === "loading" && <p role="status">Loading…</p>}
        {view.kind === "error" && (
          <section className={styles.panel}>
            <p className={styles.strong}>Your connected apps couldn&apos;t be loaded.</p>
            <div className={styles.actions}><button type="button" onClick={() => void load()}>Try again</button></div>
          </section>
        )}
        {view.kind === "list" && view.connections.length === 0 && (
          <section className={styles.panel}><p>No apps are connected to your Toone account.</p></section>
        )}
        {view.kind === "list" && view.connections.map((connection) => {
          const connected = formatConnectionDate(connection.createdAt);
          const used = formatConnectionDate(connection.lastUsedAt);
          return (
            <section key={connection.id} className={styles.panel} aria-label={connectionLabel(connection)}>
              <h2>{connectionLabel(connection)}</h2>
              <p>
                {connection.scopes.includes("act")
                  ? connection.accessMode === "auto"
                    ? "Can see and run your routines without asking again on your Mac."
                    : "Can see your routines and run them after you allow it on your Mac."
                  : "Can see your routines. It can't run them."}
              </p>
              {(connected || used) && (
                <p className={styles.quiet}>
                  {connected && <>Connected {connected}.</>}{connected && used && " "}{used && <>Last used {used}.</>}
                </p>
              )}
              <div className={styles.actions}>
                <button type="button" onClick={() => void remove(connection)} disabled={view.busy !== null} aria-busy={view.busy === connection.id}>
                  {view.busy === connection.id ? "Disconnecting…" : "Disconnect"}
                </button>
              </div>
            </section>
          );
        })}
      </div>
      {view.kind === "list" && view.notice && <p className={styles.account} role="status">{view.notice}</p>}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className={styles.page}>
      <div className={styles.column}>
        <header className={styles.header}>
          <a className={styles.brand} href="/en" aria-label="Toone">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/brand/toone-mark.svg" alt="" width={26} height={26} />toone
          </a>
        </header>
        {children}
      </div>
    </main>
  );
}
