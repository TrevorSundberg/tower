import { CodeOutput } from './code-output.mjs';

function element(tag, className, id, text) {
  const value = document.createElement(tag);
  if (className) value.className = className;
  if (id) value.id = id;
  if (text) value.textContent = text;
  return value;
}

// Every result uses the same heading, scrolling body and optional action footer.
export class OutputPane {
  constructor(parent, { id, title, description, output, label = title, syntax, phase, error, limit, downloads }) {
    this.root = element('section', 'execution-column', id);
    const heading = element('h2', '', '', title);
    if (description) heading.title = description;
    this.phase = element('span', 'output-phase', phase);
    this.phase.setAttribute('role', 'status');
    this.phase.hidden = true;
    heading.append(this.phase);
    const body = element('div', 'output-body');
    this.output = element(syntax ? 'div' : 'pre', '', output);
    this.output.setAttribute('aria-label', label);
    body.append(this.output);
    if (syntax) this.code = new CodeOutput(this.output, syntax);
    if (error) {
      const message = element('p', 'runner-error', error);
      message.setAttribute('role', 'alert'); message.hidden = true;
      body.append(message);
    }
    if (limit) {
      const message = element('p', 'runner-error', limit, 'Output limited to 64 KiB.');
      message.hidden = true; body.append(message);
    }
    this.root.append(heading, body);
    if (downloads) {
      this.footer = element('div', 'target-downloads', downloads.id);
      this.size = element('span', '', downloads.size);
      this.link = element('a', '', downloads.link);
      this.footer.hidden = true;
      this.root.append(this.footer);
    }
    parent.append(this.root);
  }
  setPhase(text = '') {
    this.phase.textContent = text;
    this.phase.hidden = !text;
  }
  setDownload(bytes, { label, filename, type = 'application/octet-stream' }) {
    this.clearDownload();
    this.url = URL.createObjectURL(new Blob([bytes], { type }));
    this.link.href = this.url; this.link.download = filename; this.link.textContent = label;
    this.size.textContent = `${bytes.length.toLocaleString()} bytes`;
    this.footer.replaceChildren(this.size, this.link);
    this.footer.hidden = false;
  }
  clearDownload() {
    if (this.url) URL.revokeObjectURL(this.url);
    this.url = null;
    this.link.removeAttribute('href');
    this.footer.replaceChildren();
    this.footer.hidden = true;
  }
}
