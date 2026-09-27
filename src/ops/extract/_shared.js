export function extractAll(docs, buildRegex, joinWith = '\n') {
  return docs.map((d) => {
    const matches = d.text.match(buildRegex()) || [];
    return { ...d, text: matches.join(joinWith) };
  });
}
