import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('viewer-toolbar')
export class ViewerToolbar extends LitElement {
  static styles = css`
    :host {
      display: block;
      height: 48px;
      background: #fff;
      border-bottom: 1px solid #eee;
      padding: 0 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 10;
    }

    .title {
      font-size: 15px;
      font-weight: 700;
      color: #333;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    button {
      background: none;
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 13px;
      cursor: pointer;
      color: #555;
      transition: all 0.15s;
    }

    button:hover {
      background: #f5f5f5;
      border-color: #bbb;
    }

    button.active {
      background: var(--dp-accent, #2563eb);
      color: white;
      border-color: var(--dp-accent, #2563eb);
    }

    .save-indicator {
      font-size: 12px;
      color: #999;
      min-width: 50px;
    }
  `;

  @property() title = '';
  @property({ type: Boolean }) editMode = false;
  @property() saveStatus: 'idle' | 'saving' | 'saved' = 'idle';

  render() {
    return html`
      <div class="title">${this.title}</div>
      <div class="actions">
        <span class="save-indicator">
          ${this.saveStatus === 'saving' ? 'Saving...' : this.saveStatus === 'saved' ? 'Saved' : ''}
        </span>
        <button
          class="${this.editMode ? 'active' : ''}"
          @click=${() => this.dispatchEvent(new CustomEvent('toggle-edit', { bubbles: true, composed: true }))}
          title="Toggle edit mode"
        >${this.editMode ? 'Editing' : 'Edit'}</button>
      </div>
    `;
  }
}
