const mark = 'data-zai-local-time';
const annotations = new Map<Text, HTMLSpanElement>();
const formatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric', month: 'short', day: 'numeric',
  hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
});

function resetDate(text: string): Date | null {
  const match = text.trim().match(/^(?:Reset\s+Time\s*[:：]?\s*)?(?:(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})[ T]+)?(\d{1,2}):(\d{2})(?::(\d{2}))?$/i);
  if (!match) return null;
  const [, year, month, day, hour, minute, second = '0'] = match;
  const singaporeToday = new Date(Date.now() + 8 * 3600_000);
  const y = year ? +year : singaporeToday.getUTCFullYear();
  const m = month ? +month - 1 : singaporeToday.getUTCMonth();
  const d = day ? +day : singaporeToday.getUTCDate();
  const source = new Date(Date.UTC(y, m, d, +hour, +minute, +second));
  if (source.getUTCFullYear() !== y || source.getUTCMonth() !== m || source.getUTCDate() !== d
    || +hour > 23 || +minute > 59 || +second > 59) return null;
  let timestamp = source.getTime() - 8 * 3600_000;
  // shortcut: time-only values mean the next Singapore occurrence; use API dates if z.ai changes this convention.
  if (!year && timestamp <= Date.now()) timestamp += 86400_000;
  return new Date(timestamp);
}

function isReset(node: Text): boolean {
  if (/reset\s+time/i.test(node.data)) return true;
  let parent = node.parentElement;
  for (let depth = 0; parent && depth < 3; depth++, parent = parent.parentElement) {
    let text = parent.textContent ?? '';
    for (const label of parent.querySelectorAll(`[${mark}]`)) text = text.replace(label.textContent ?? '', '');
    if (text.length > 160) break;
    if (/refresh/i.test(text)) return false;
    if (/reset\s+time/i.test(text)) return true;
  }
  return false;
}

function scan() {
  observer.disconnect();
  const active = new Set<Text>();
  if (location.pathname.startsWith('/manage-apikey/')) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      if (node.parentElement?.closest(`[${mark}], script, style, textarea, input, select, [contenteditable]:not([contenteditable="false"])`)) continue;
      if (!isReset(node)) continue;
      const date = resetDate(node.data);
      if (!date) continue;
      active.add(node);
      let label = annotations.get(node);
      if (!label) {
        label = document.createElement('span');
        label.setAttribute(mark, '');
        label.style.cssText = 'font-size:0.9em; margin-inline-start:0.4em; overflow-wrap:anywhere;';
        annotations.set(node, label);
      }
      label.textContent = `→ ${formatter.format(date)} (local)`;
      label.title = `Original: ${node.data.trim()} (UTC+8 / Singapore)\nLocal zone: ${formatter.resolvedOptions().timeZone}`;
      node.parentNode?.insertBefore(label, node.nextSibling);
    }
  }
  for (const [node, label] of annotations) {
    if (!active.has(node)) {
      label.remove();
      annotations.delete(node);
    }
  }
  observer.observe(document.body, { childList: true, characterData: true, subtree: true });
}

let scheduled = false;
const observer = new MutationObserver(() => {
  if (scheduled) return;
  scheduled = true;
  setTimeout(() => {
    scheduled = false;
    scan();
  }, 0);
});
scan();
