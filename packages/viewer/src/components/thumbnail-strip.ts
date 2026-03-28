import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import './slide-renderer.js';

@customElement('thumbnail-strip')
export class ThumbnailStrip extends LitElement {
  static styles = css`
    :host { display: block; }

    .thumbnail {
      width: 100%;
      aspect-ratio: 16 / 9;
      margin-bottom: 8px;
      border-radius: 4px;
      overflow: hidden;
      cursor: pointer;
      border: 2px solid transparent;
      background: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      transition: border-color 0.15s;
      position: relative;
    }

    .thumbnail:hover {
      border-color: #bbb;
    }

    .thumbnail.active {
      border-color: var(--dp-accent, #2563eb);
    }

    .thumbnail-inner {
      width: 960px;
      height: 540px;
      transform-origin: top left;
      transform: scale(calc(120 / 960));
      pointer-events: none;
    }

    .thumb-number {
      position: absolute;
      bottom: 2px;
      right: 4px;
      font-size: 9px;
      color: #999;
      z-index: 1;
    }
  `;

  @property({ type: Array }) slides: Array<{ layout: string; content: Record<string, unknown> }> = [];
  @property({ type: Number }) currentIndex = 0;
  @property() theme = 'minimal';

  render() {
    return html`
      ${this.slides.map((slide, i) => html`
        <div
          class="thumbnail ${i === this.currentIndex ? 'active' : ''} theme-${this.theme}"
          @click=${() => this.dispatchEvent(new CustomEvent('thumbnail-click', { detail: i, bubbles: true, composed: true }))}
        >
          <span class="thumb-number">${i + 1}</span>
          <div class="thumbnail-inner">
            <slide-renderer .slide=${slide} .editable=${false}></slide-renderer>
          </div>
        </div>
      `)}
    `;
  }
}
