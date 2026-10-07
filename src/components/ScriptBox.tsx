/** The script with each [blank] shown as a fill-in (underlined, in a different color), so readers see what to replace. */
function withBlanks(script: string) {
  return script.split(/(\[[^\]]+\])/).map((part, i) => (i % 2 ? <span key={i} className="script-blank">{part.slice(1, -1)}</span> : part));
}

/**
 * Words to use with an official seller or a professional: who to ask, then the script with blanks in [brackets].
 * `heading` replaces the default "What to say: {to}" when a plainer one reads better ("What to say to a loan officer").
 */
export default function ScriptBox({ to, script, note, heading }: { to: string; script: string; note?: string; heading?: string }) {
  return (
    <div className="script-box">
      <h3>{heading ?? `What to say: ${to.replace(/^The /, 'the ')}`}</h3>
      <blockquote className="roadmap-script">{withBlanks(script)}</blockquote>
      {note && <p className="muted">{note}</p>}
    </div>
  );
}
