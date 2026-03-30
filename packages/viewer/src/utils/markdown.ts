import { Marked } from 'marked';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

const block = new Marked({
  async: false,
  gfm: true,
  breaks: true,
});

const inline = new Marked({
  async: false,
  gfm: true,
  breaks: true,
});

/** Render markdown string to Lit-safe HTML (block-level: paragraphs, lists, etc.) */
export function md(text: string | undefined) {
  if (!text) return '';
  const html = block.parse(text) as string;
  return unsafeHTML(html);
}

/** Render markdown string to Lit-safe HTML (inline only: bold, italic, code, links) */
export function mdInline(text: string | undefined) {
  if (!text) return '';
  const html = inline.parseInline(text) as string;
  return unsafeHTML(html);
}
