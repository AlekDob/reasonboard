/** Supports inline **bold** */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        const m = p.match(/^\*\*([^*]+)\*\*$/);
        if (m) return <strong key={i}>{m[1]}</strong>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

export function TitleHtml({ html }: { html: string }) {
  const parts = html.split(/(<em>.*?<\/em>|<br\s*\/?>)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (!p) return null;
        if (/^<br\s*\/?>$/i.test(p)) return <br key={i} />;
        const m = p.match(/^<em>(.*?)<\/em>$/);
        if (m) return <em key={i}>{m[1]}</em>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}
