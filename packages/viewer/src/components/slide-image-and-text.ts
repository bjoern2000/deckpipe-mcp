import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SlideBase } from './slide-base.js';

@customElement('slide-image-and-text')
export class SlideImageAndText extends SlideBase {
  static styles = [
    SlideBase.baseStyles,
    css`
      .slide {
        flex-direction: row;
        gap: 32px;
      }
      .image-area {
        flex: 0 0 58%;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      .image-area img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 6px;
      }
      .text-area {
        flex: 1;
        display: flex;
        flex-direction: column;
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
    return html`
      <div class="slide">
        <div class="image-area">
          ${this.imageUrl
            ? this.editable
              ? this.wrapDeletable('image_url', html`<img src="${this.imageUrl}" alt="" />`, null)
              : html`<img src="${this.imageUrl}" alt="" />`
            : ''}
        </div>
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
      </div>
    `;
  }
}
