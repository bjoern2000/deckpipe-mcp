import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SlideBase } from './slide-base.js';

@customElement('slide-two-columns')
export class SlideTwoColumns extends SlideBase {
  static styles = [
    SlideBase.baseStyles,
    css`
      .columns {
        display: flex;
        gap: 32px;
        flex: 1;
      }
      .column {
        flex: 1;
      }
      .column h2 {
        margin-bottom: 8px;
      }
      .column p {
        white-space: pre-wrap;
      }
      .bottom-image {
        margin-top: 16px;
        text-align: center;
      }
      .bottom-image img {
        max-height: 200px;
      }
    `,
  ];

  @property() title = '';
  @property({ type: Object }) left: { heading: string; body: string } = { heading: '', body: '' };
  @property({ type: Object }) right: { heading: string; body: string } = { heading: '', body: '' };
  @property({ attribute: 'image-url' }) imageUrl = '';
  @property({ attribute: 'key-takeaway' }) keyTakeaway = '';
  @property({ type: Boolean }) editable = false;

  render() {
    return html`
      <div class="slide">
        ${this.editable ? this.wrapDeletable('title', html`
          <h1 contenteditable="true"
            @blur=${(e: FocusEvent) => this.emitChange('title', (e.target as HTMLElement).textContent)}
          >${this.title}</h1>
        `) : html`<h1>${this.title}</h1>`}
        ${this.renderKeyTakeaway(this.keyTakeaway, this.editable)}
        <div class="columns">
          ${this.editable ? this.wrapDeletable('left', html`
            <div class="column">
              <h2 contenteditable="true"
                @blur=${(e: FocusEvent) => this.emitChange('left', { ...this.left, heading: (e.target as HTMLElement).textContent || '' })}
              >${this.left.heading}</h2>
              <p contenteditable="true"
                @blur=${(e: FocusEvent) => this.emitChange('left', { ...this.left, body: (e.target as HTMLElement).textContent || '' })}
              >${this.left.body}</p>
            </div>
          `, null) : html`
            <div class="column">
              <h2>${this.left.heading}</h2>
              <p>${this.left.body}</p>
            </div>
          `}
          ${this.editable ? this.wrapDeletable('right', html`
            <div class="column">
              <h2 contenteditable="true"
                @blur=${(e: FocusEvent) => this.emitChange('right', { ...this.right, heading: (e.target as HTMLElement).textContent || '' })}
              >${this.right.heading}</h2>
              <p contenteditable="true"
                @blur=${(e: FocusEvent) => this.emitChange('right', { ...this.right, body: (e.target as HTMLElement).textContent || '' })}
              >${this.right.body}</p>
            </div>
          `, null) : html`
            <div class="column">
              <h2>${this.right.heading}</h2>
              <p>${this.right.body}</p>
            </div>
          `}
        </div>
        ${this.imageUrl
          ? this.editable
            ? this.wrapDeletable('image_url', html`
                <div class="bottom-image"><img src="${this.imageUrl}" alt="" /></div>
              `, null)
            : html`<div class="bottom-image"><img src="${this.imageUrl}" alt="" /></div>`
          : ''}
      </div>
    `;
  }
}
