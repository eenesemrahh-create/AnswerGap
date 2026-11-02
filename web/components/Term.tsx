/* "AI Overview" is an English name inside translated text. Under lang="tr",
 * `text-transform: uppercase` turns its i into a dotted capital ("OVERVİEW"),
 * so the name carries its own language wherever a label is drawn in capitals. */
export function Term({ text }: { text: string }) {
  return text
    .split(/(AI Overview)/)
    .map((part, i) => (i % 2 ? <span key={i} lang="en">{part}</span> : part));
}
