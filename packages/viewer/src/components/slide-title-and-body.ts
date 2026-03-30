import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SlideBase } from './slide-base.js';

@customElement('slide-title-and-body')
export class SlideTitleAndBody extends SlideBase {
  static styles = [
    SlideBase.baseStyles,
    css`
      .with-image {
        flex-direction: row;
        gap: 32px;
      }
      .text-area { flex: 1; }
      .image-area {
        flex: 0 0 40%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .body-text { white-space: pre-wrap; }
    `,
  ];

  @property() title = '';
  @property() body = '';
  @property({ attribute: 'image-url' }) imageUrl = '';
  @property({ attribute: 'key-takeaway' }) keyTakeaway = '';
  @property({ type: Boolean }) editable = false;

  render() {
    const hasImage = !!this.imageUrl;
    return html`
      <div class="slide ${hasImage ? 'with-image' : ''}">
        <div class="text-area">
          ${this.editable ? this.wrapDeletable('title', html`
            <h1 contenteditable="true"
              @blur=${(e: FocusEvent) => this.emitChange('title', (e.target as HTMLElement).textContent)}
            >${this.title}</h1>
          `) : html`<h1>${this.title}</h1>`}
          ${this.renderKeyTakeaway(this.keyTakeaway, this.editable)}
          ${this.editable ? this.wrapDeletable('body', html`
            <p class="body-text" contenteditable="true"
              @blur=${(e: FocusEvent) => this.emitChange('body', (e.target as HTMLElement).textContent)}
            >${this.body}</p>
          `) : html`<p class="body-text">${this.body}</p>`}
        </div>
        ${hasImage
          ? this.editable
            ? this.wrapDeletable('image_url', html`
                <div class="image-area"><img src="${this.imageUrl}" alt="" /></div>
              `, null)
            : html`<div class="image-area"><img src="${this.imageUrl}" alt="" /></div>`
          : ''}
      </div>
    `;
  }
}
