/** Words to use with an official seller or a professional: who to ask, then the script with blanks in [brackets]. */
export default function ScriptBox({ to, script, note }: { to: string; script: string; note?: string }) {
  return (
    <div className="script-box">
      <h3>What to say: {to}</h3>
      <blockquote className="roadmap-script">{script}</blockquote>
      {note && <p className="muted">{note}</p>}
    </div>
  );
}
