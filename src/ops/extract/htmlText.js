function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export default {
  id: 'extract.htmlText',
  name: 'Extract HTML text',
  group: 'Extract',
  summary: 'Strip HTML tags, leaving plain text (a lightweight regex-based stripper, not a full parser).',
  arity: 'map',
  previewFidelity: 'exact',
  cost: 'linear',
  params: [],
  describe() {
    return 'Extract HTML text';
  },
  run(docs) {
    return docs.map((d) => {
      const noScripts = d.text.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '');
      const text = decodeEntities(noScripts.replace(/<[^>]+>/g, ''));
      return { ...d, text: text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim() };
    });
  },
  examples: [
    { params: {}, in: ['<p>Hello <b>world</b>!</p>'], out: ['Hello world!'] },
    { params: {}, in: ['<script>alert(1)</script><p>Safe &amp; sound</p>'], out: ['Safe & sound'] }
  ]
};
