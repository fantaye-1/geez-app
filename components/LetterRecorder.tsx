"use client";

import { useEffect, useRef, useState } from "react";
import { uploadLetterAudio } from "@/lib/letterAudio";

const MAX_SECONDS = 4;
const PREFERRED_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];

type State =
  | { kind: "idle" }
  | { kind: "recording" }
  | { kind: "preview"; blob: Blob; url: string }
  | { kind: "saving"; blob: Blob; url: string }
  | { kind: "error"; message: string };

/**
 * Record → listen back → save, for one letter. Shown only to the owner
 * and admins with the "audio" permission.
 */
export default function LetterRecorder({
  letterId,
  label,
  hasRecording,
  onSaved,
}: {
  letterId: string;
  /** e.g. "ሀ (hä)" for screen readers and messages */
  label: string;
  hasRecording: boolean;
  onSaved: (url: string) => void;
}) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const recorder = useRef<MediaRecorder | null>(null);
  const stopTimer = useRef<ReturnType<typeof setTimeout>>();

  // Switching letters throws away an unsaved take and stops the mic.
  useEffect(() => {
    return () => {
      clearTimeout(stopTimer.current);
      if (recorder.current?.state === "recording") recorder.current.stop();
      recorder.current = null;
      setState((s) => {
        if (s.kind === "preview" || s.kind === "saving") URL.revokeObjectURL(s.url);
        return { kind: "idle" };
      });
    };
  }, [letterId]);

  async function start() {
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setState({ kind: "error", message: "This browser can't record audio." });
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setState({ kind: "error", message: "Microphone access was blocked. Allow it in the browser and try again." });
      return;
    }
    const mimeType = PREFERRED_TYPES.find((t) => MediaRecorder.isTypeSupported(t));
    const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
    rec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      clearTimeout(stopTimer.current);
      if (recorder.current !== rec) return; // letter changed meanwhile
      const blob = new Blob(chunks, { type: rec.mimeType || mimeType || "audio/webm" });
      setState({ kind: "preview", blob, url: URL.createObjectURL(blob) });
    };
    recorder.current = rec;
    rec.start();
    setState({ kind: "recording" });
    stopTimer.current = setTimeout(() => rec.state === "recording" && rec.stop(), MAX_SECONDS * 1000);
  }

  function stop() {
    if (recorder.current?.state === "recording") recorder.current.stop();
  }

  function discard() {
    if (state.kind === "preview") URL.revokeObjectURL(state.url);
    setState({ kind: "idle" });
  }

  async function save() {
    if (state.kind !== "preview") return;
    const { blob, url } = state;
    setState({ kind: "saving", blob, url });
    try {
      const saved = await uploadLetterAudio(letterId, blob);
      URL.revokeObjectURL(url);
      setState({ kind: "idle" });
      onSaved(saved);
    } catch (e) {
      setState({
        kind: "error",
        message: `Couldn't save: ${e instanceof Error ? e.message : "unknown error"}`,
      });
    }
  }

  const button =
    "rounded-md border border-border px-3 py-1.5 text-sm text-ink hover:border-gold disabled:opacity-50";

  return (
    <div className="mt-4 border-t border-border pt-4 text-left" data-testid="recorder">
      <p className="font-mono text-[10px] uppercase tracking-wide text-ink/60">
        Recording · {hasRecording ? "replace" : "not recorded yet"}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {(state.kind === "idle" || state.kind === "error") && (
          <button type="button" onClick={start} className={button} aria-label={`Record ${label}`}>
            <span className="text-rubric">●</span> {hasRecording ? "Re-record" : "Record"}
          </button>
        )}
        {state.kind === "recording" && (
          <button type="button" onClick={stop} className={`${button} border-rubric`}>
            <span className="animate-pulse text-rubric">■</span> Stop
          </button>
        )}
        {(state.kind === "preview" || state.kind === "saving") && (
          <>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio src={state.url} controls className="h-8 w-full" />
            <button
              type="button"
              onClick={save}
              disabled={state.kind === "saving"}
              className="rounded-md bg-rubric px-3 py-1.5 text-sm text-parchment hover:bg-rubric/90 disabled:opacity-60"
            >
              {state.kind === "saving" ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={discard} disabled={state.kind === "saving"} className={button}>
              Discard
            </button>
          </>
        )}
      </div>
      {state.kind === "recording" && (
        <p className="mt-2 text-xs text-ink/60">Say the letter once — stops by itself after {MAX_SECONDS} seconds.</p>
      )}
      {state.kind === "error" && (
        <p className="mt-2 text-xs text-rubric" role="alert">
          {state.message}
        </p>
      )}
    </div>
  );
}
