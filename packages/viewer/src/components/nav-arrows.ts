import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('nav-arrows')
export class NavArrows extends LitElement {
  static styles = css`
    :host {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 5;
    }

    .arrow {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 48px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      pointer-events: auto;
      opacity: 0;
      transition: opacity 0.2s;
      font-size: 28px;
      color: #666;
      user-select: none;
    }

    :host(:hover) .arrow.visible {
      opacity: 0.5;
    }

    .arrow:hover {
      opacity: 1 !important;
    }

    .prev { left: 8px; }
    .next { right: 8px; }
  `;

  @property({ type: Boolean }) hasPrev = false;
  @property({ type: Boolean }) hasNext = false;

  render() {
    return html`
      <div
        class="arrow prev ${this.hasPrev ? 'visible' : ''}"
        @click=${() => this.hasPrev && this.dispatchEvent(new CustomEvent('nav-prev', { bubbles: true, composed: true }))}
      >&lsaquo;</div>
      <div
        class="arrow next ${this.hasNext ? 'visible' : ''}"
        @click=${() => this.hasNext && this.dispatchEvent(new CustomEvent('nav-next', { bubbles: true, composed: true }))}
      >&rsaquo;</div>
    `;
  }
}
