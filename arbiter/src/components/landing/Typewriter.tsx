import { useEffect, useState } from "react";

const PHRASES = [
  "Ingest 10-K filing…",
  "Analyze revenue trend…",
  "Check P/E vs peers…",
  "Signal: undervalued.",
  "Mandate: BUY — High Conviction.",
];

export const Typewriter = () => {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = PHRASES[phraseIdx];
    let timeout: number;

    if (!deleting && text === current) {
      timeout = window.setTimeout(() => setDeleting(true), 1600);
    } else if (deleting && text === "") {
      setDeleting(false);
      setPhraseIdx((i) => (i + 1) % PHRASES.length);
    } else {
      timeout = window.setTimeout(
        () => {
          setText(deleting ? current.slice(0, text.length - 1) : current.slice(0, text.length + 1));
        },
        deleting ? 28 : 55
      );
    }
    return () => clearTimeout(timeout);
  }, [text, deleting, phraseIdx]);

  return (
    <span className="font-mono text-primary">
      {text}
      <span className="inline-block w-[2px] h-[1em] bg-primary align-[-2px] ml-0.5 animate-caret" />
    </span>
  );
};
