// Keep short Russian prepositions with the following word in rendered copy.
const shortPreposition = /(^|[^\p{L}\p{N}-])((?:из-за|из-под|в|во|к|ко|с|со|у|о|об|обо|от|ото|из|изо|на|за|по|под|подо|над|надо|без|до|для|при|про|через|между|перед|около|и))[ \t]+(?=\S)/giu;
function bindWords(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    if (node.parentElement?.closest('script,style,textarea,[contenteditable="true"]')) return;
    const text = node.data.replace(shortPreposition, '$1$2\u00a0');
    if (text !== node.data) node.data = text;
  } else {
    node.childNodes.forEach(bindWords);
  }
}
bindWords(document.body);
new MutationObserver(records => {
  for (const record of records) {
    if (record.type === 'characterData') bindWords(record.target);
    else record.addedNodes.forEach(bindWords);
  }
}).observe(document.body, {subtree:true, childList:true, characterData:true});
