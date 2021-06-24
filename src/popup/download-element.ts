import {DownloadItem} from '../background/services/download-manager/interfaces';

/**
<download-element>
  <div class="cell state"><i class="fas fa-exclamation-circle"></i></div>
  <div class="cell name">Some song</div>
  <div class="cell estimated-time-left">12<span class="units">s</span></div>
  <div class="cell download-speed">321<span class="units">Kb/s</span></div>
</download-element>
 */

type TimeUnits = 's' | 'm' | 'h';
type SpeedUnits = 'Kb/s' | 'Mb/s';

export class HTMLDownloadElement extends HTMLElement {
  private static isInited = false;

  private downloadItem_: DownloadItem;
  private error_: Error | null;

  private stateIconStyle_(state: DownloadItem['state']) {
    const mapping = new Map([
      ['in_progress', 'fas fa-spinner'],
      ['pending', 'far fa-circle'],
      ['complete', 'fas fa-check-circle'],
      ['interrupted', 'fas fa-exclamation-circle'],
    ]);
    return mapping.get(state);
  }

  private trimNameToLength_(name: string, length: number): string {
    if (name.length <= length) return name;
    return name.slice(0, length - 3) + '...';
  }

  private getEstimatedTime_(): {time: number; units: TimeUnits} | null {
    if (this.downloadItem_.downloadedSize === 0) return null;

    const time =
      ((Date.now() - this.downloadItem_.startMs) /
        this.downloadItem_.downloadedSize) *
        this.downloadItem_.size -
      (Date.now() - this.downloadItem_.startMs);

    if (time / 1000 / 60 / 60 >= 1) {
      return {time: time / 1000 / 60 / 60, units: 's'};
    } else if (time / 1000 / 60 >= 1) {
      return {time: time / 1000 / 60, units: 'm'};
    } else {
      return {time: time / 1000, units: 's'};
    }
  }

  private getSpeed_(): {speed: number; units: SpeedUnits} | null {
    if (this.downloadItem_.downloadedSize === 0) return null;

    const speed =
      this.downloadItem_.downloadedSize /
      ((Date.now() - this.downloadItem_.startMs) / 1000);

    if (speed / 1000 / 1000 >= 1) {
      return {speed: speed / 1000 / 1000, units: 'Mb/s'};
    } else {
      return {speed: speed / 1000, units: 'Kb/s'};
    }
  }

  constructor(downloadItem: DownloadItem) {
    if (!HTMLDownloadElement.isInited) {
      customElements.define('download-element', HTMLDownloadElement);
      HTMLDownloadElement.isInited = true;
    }
    super();

    this.downloadItem_ = downloadItem;
    this.error_ = null;

    this.classList.add('row');

    this.update(downloadItem);
  }

  get downloadItem(): DownloadItem {
    return this.downloadItem_;
  }

  update(downloadItem: DownloadItem): void {
    this.downloadItem_ = downloadItem;
    this.setAttribute('state', this.downloadItem_.state);

    this.innerHTML = `
    <div class="cell state">
      <i class="${this.stateIconStyle_(downloadItem.state)}"></i>
    </div>
    <div class="cell name">
      ${this.trimNameToLength_(downloadItem.name, 15)}
    </div>`;

    if (this.getSpeed_() && this.getEstimatedTime_()) {
      const speed = this.getSpeed_()!;
      const time = this.getEstimatedTime_()!;

      this.innerHTML += `
      <div class="cell estimated-time-left">
        ${time.time.toFixed(2)}<span class="units">${time.units}</span>
      </div>
      <div class="cell download-speed">
        ${speed.speed.toFixed(2)}<span class="units">${speed.units}</span>
      </div>`;
    } else {
      this.innerHTML += `
      <div class="cell estimated-time-left">
        -<span class="units"></span>
      </div>
      <div class="cell download-speed">
        -<span class="units"></span>
      </div>`;
    }
  }

  setError(err: Error) {
    this.error_ = err;
  }

  getError() {
    return this.error_;
  }
}
