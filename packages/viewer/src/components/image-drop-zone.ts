import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('image-drop-zone')
export class ImageDropZone extends LitElement {
  static styles = css`
    :host {
      position: absolute;
      bottom: 12px;
      right: 12px;
      z-index: 10;
    }

    .drop-area {
      width: 120px;
      height: 80px;
      border: 2px dashed #ccc;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      color: #999;
      cursor: pointer;
      transition: all 0.15s;
      background: rgba(255,255,255,0.9);
    }

    .drop-area:hover, .drop-area.dragging {
      border-color: var(--dp-accent, #2563eb);
      color: var(--dp-accent, #2563eb);
      background: rgba(37,99,235,0.05);
    }

    .has-image {
      position: relative;
    }

    .remove-btn {
      position: absolute;
      top: -6px;
      right: -6px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #e00;
      color: white;
      border: none;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }

    input[type="file"] { display: none; }
  `;

  @property({ type: Boolean }) hasImage = false;
  @state() private dragging = false;

  private onDragOver(e: DragEvent) {
    e.preventDefault();
    this.dragging = true;
  }

  private onDragLeave() {
    this.dragging = false;
  }

  private async onDrop(e: DragEvent) {
    e.preventDefault();
    this.dragging = false;
    const file = e.dataTransfer?.files[0];
    if (file) await this.uploadFile(file);
  }

  private onClick() {
    this.shadowRoot?.querySelector<HTMLInputElement>('input[type="file"]')?.click();
  }

  private async onFileSelected(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) await this.uploadFile(file);
  }

  private async uploadFile(file: File) {
    const form = new FormData();
    form.append('file', file);

    try {
      const res = await fetch('/v1/images', { method: 'POST', body: form });
      if (!res.ok) return;
      const data = await res.json();
      this.dispatchEvent(new CustomEvent('image-uploaded', {
        detail: { url: data.url },
        bubbles: true,
        composed: true,
      }));
    } catch {
      // silently fail
    }
  }

  render() {
    if (this.hasImage) {
      return html`
        <div class="has-image">
          <button class="remove-btn" @click=${() =>
            this.dispatchEvent(new CustomEvent('image-removed', { bubbles: true, composed: true }))
          }>&times;</button>
        </div>
      `;
    }

    return html`
      <div
        class="drop-area ${this.dragging ? 'dragging' : ''}"
        @dragover=${this.onDragOver}
        @dragleave=${this.onDragLeave}
        @drop=${this.onDrop}
        @click=${this.onClick}
      >
        Drop image
        <input type="file" accept="image/png,image/jpeg,image/webp" @change=${this.onFileSelected} />
      </div>
    `;
  }
}
