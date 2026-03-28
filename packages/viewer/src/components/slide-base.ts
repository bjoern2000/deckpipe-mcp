import { LitElement, css } from 'lit';

export class SlideBase extends LitElement {
  static baseStyles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    .slide {
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      padding: 48px 56px;
      display: flex;
      flex-direction: column;
      background: var(--dp-bg, #ffffff);
      font-family: var(--dp-font-body, 'Inter', sans-serif);
      font-weight: var(--dp-font-body-weight, 400);
      color: var(--dp-text-body, #444);
      position: relative;
      overflow: hidden;
    }

    h1 {
      font-family: var(--dp-font-heading, 'Inter', sans-serif);
      font-weight: var(--dp-font-heading-weight, 600);
      color: var(--dp-text-title, #1a1a1a);
      margin: 0 0 16px 0;
      font-size: 2.2em;
      line-height: 1.2;
    }

    h2 {
      font-family: var(--dp-font-heading, 'Inter', sans-serif);
      font-weight: var(--dp-font-heading-weight, 600);
      color: var(--dp-text-title, #1a1a1a);
      margin: 0 0 12px 0;
      font-size: 1.4em;
      line-height: 1.3;
    }

    p, li, td {
      font-size: 1.05em;
      line-height: 1.6;
    }

    img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      border-radius: 4px;
    }

    [contenteditable="true"] {
      outline: none;
      cursor: text;
      border-radius: 2px;
      transition: box-shadow 0.15s ease;
    }

    [contenteditable="true"]:hover {
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12) dashed;
    }

    [contenteditable="true"]:focus {
      box-shadow: 0 0 0 2px var(--dp-accent, #2563eb);
    }
  `;

  protected emitChange(field: string, value: unknown) {
    this.dispatchEvent(new CustomEvent('slide-content-changed', {
      detail: { field, value },
      bubbles: true,
      composed: true,
    }));
  }
}
