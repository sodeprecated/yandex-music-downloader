import https from 'https';
import {IncomingMessage} from 'http';

import {
  DownloadItem,
  DownloadManager as IDownloadManager,
  DownloadItemState,
  HookType,
  AsyncHookCallback,
  AsyncErrorCallback,
} from './interfaces';

type DownloadPartialCallback = (
  bytes: number,
  totalBytes: number,
  closeConnection: () => void
) => void;

export class DownloadManager implements IDownloadManager {
  private concurrency_: number;

  private lastId_ = 1;
  private inProgressSize_: number;
  private downloadQueue_: DownloadItem[];

  private queuePaused_: boolean;

  private async downloadBuffer_(
    uri: string,
    callback: DownloadPartialCallback
  ) {
    const options = {
      path: uri,
      headers: {
        Connection: 'keep-alive',
        Accept: '*/*',
        'Access-Control-Allow-Headers': 'origin, content-type, accept',
      },
    };

    return new Promise<Buffer | null>((resolve, reject) => {
      const request = https
        .get(options, (res: IncomingMessage) => {
          const rawData: Buffer[] = [];
          const totalBytes = +(res.headers['content-length'] ?? -1);

          const closeConnection = () => {
            request.destroy();
            resolve(null);
          };

          res.on('data', (chunk: Buffer) => {
            rawData.push(chunk);
            callback(chunk.byteLength, totalBytes, closeConnection);
          });
          res.on('error', reject);
          res.on('end', () => {
            resolve(Buffer.concat(rawData));
          });
        })
        .on('error', reject);
    });
  }

  private queueRemove_(downloadItemId: number) {
    const index = this.downloadQueue_.findIndex(
      item => item.id === downloadItemId
    );

    if (index === -1) return;
    this.downloadQueue_.splice(index, 1);
  }

  private async queueProcessNext_() {
    if (this.inProgressSize_ === this.concurrency_) return;
    if (this.queuePaused_) return;

    const downloadItem = this.downloadQueue_.find(
      item => item.state === DownloadItemState.PENDING
    );

    if (!downloadItem) return;

    this.inProgressSize_++;

    downloadItem.startMs = Date.now();
    downloadItem.state = DownloadItemState.IN_PROGRESS;

    /* EMIT state change */
    this.emit_('progress', downloadItem);

    try {
      downloadItem.bytes = await this.downloadBuffer_(
        downloadItem.uri,
        (cur, total, closeConnection) => {
          downloadItem.size = total;
          downloadItem.downloadedSize += cur;

          if (downloadItem.state === DownloadItemState.INTERRUPTED) {
            closeConnection();
          }
          /* EMIT progress */
          this.emit_('progress', downloadItem);
        }
      );

      if (downloadItem.bytes === null) {
        downloadItem.state = DownloadItemState.INTERRUPTED;
        /* EMIT interrupted */
        this.emit_('interrupted', downloadItem);
      } else {
        downloadItem.state = DownloadItemState.COMPLETE;
        /* EMIT complete */
        this.emit_('complete', downloadItem);
      }
    } catch (err) {
      downloadItem.state = DownloadItemState.ERROR;
      /* EMIT ERROR */
      this.emitError_(downloadItem, err);
    }

    this.inProgressSize_--;

    this.queueRemove_(downloadItem.id);
    this.queueProcessNext_();
  }

  constructor(concurrency = 1) {
    this.downloadQueue_ = [];
    this.queuePaused_ = false;
    this.concurrency_ = concurrency;

    this.inProgressSize_ = 0;
  }
  /**
   * Downloads file from provided uri and saves it
   */
  download(
    uri: string,
    name: string,
    filename: string,
    downloadPath = '',
    customData?: {[key: string]: string | number | boolean | Buffer}
  ): DownloadItem {
    const downloadItem: DownloadItem = {
      id: this.lastId_++,
      name,
      state: DownloadItemState.PENDING,
      filename,
      downloadPath,
      uri,
      bytes: null,
      size: -1,
      downloadedSize: 0,
      startMs: -1 /* timestamp in ms */,
      customData,
    };

    this.downloadQueue_.push(downloadItem);

    this.emit_('add', downloadItem);

    this.queueProcessNext_();

    return downloadItem;
  }
  /**
   * Stops downloading.
   * @return true if successeed
   */
  interrupt(downloadItemId: number) {
    const downloadItem = this.downloadQueue_.find(
      item => item.id === downloadItemId
    );

    if (downloadItem) {
      if (downloadItem.state === DownloadItemState.IN_PROGRESS) {
        downloadItem.state = DownloadItemState.INTERRUPTED;
      } else if (downloadItem.state === DownloadItemState.PENDING) {
        downloadItem.state = DownloadItemState.INTERRUPTED;
        /* EMIT interrupted */
        this.emit_('interrupted', downloadItem);
        this.queueRemove_(downloadItemId);
      }
    }
  }
  /**
   * Removes item from queue.
   */
  remove(downloadItemId: number) {
    this.queueRemove_(downloadItemId);
  }
  /**
   * Proceeds queue execution.
   */
  run(): void {
    this.queuePaused_ = false;
    this.queueProcessNext_();
  }
  /**
   * Stops queue execution. Doen't stop downloads in progress.
   * Only prevent new ones from being downloaded.
   */
  stop(): void {
    this.queuePaused_ = true;
  }
  /**
   * Clears the queue. Removes from queue all elements that
   * are not being downloaded.
   */
  clear(): void {
    this.downloadQueue_ = this.downloadQueue_.filter(
      item => item.state !== DownloadItemState.PENDING
    );
  }
  /**
   * @return current size of queue
   */
  size(): number {
    return this.downloadQueue_.length;
  }
  /**
   * @return all items in queue
   */
  list(): DownloadItem[] {
    return this.downloadQueue_;
  }
  /**
   * @return number of items that is currently downloading
   */
  inProgressSize(): number {
    return this.inProgressSize_;
  }

  /* Hooks */

  private listeners_: {[key: string]: AsyncHookCallback[]} = {
    add: [],
    interrupted: [],
    progress: [],
    complete: [],
  };
  private errorListeners_: AsyncErrorCallback[] = [];
  /**
   * Emits event of type `type` passing to it target download item
   */
  private async emit_(type: HookType, item: DownloadItem) {
    for await (const listener of this.listeners_[type]) {
      try {
        await listener(item);
      } catch (err) {
        console.error(err);
      }
    }
  }
  /**
   * Emits error event passing to it target download item and error
   */
  private async emitError_(item: DownloadItem, err: Error) {
    console.error(err);
    for await (const errorListener of this.errorListeners_) {
      try {
        await errorListener(item, err);
      } catch (err) {
        console.error(err);
      }
    }
  }

  /* Hooks */
  on(type: HookType, callback: AsyncHookCallback): void {
    if (this.listeners_[type].includes(callback)) return;
    this.listeners_[type].push(callback);
  }
  /* Removes hook */
  removeListener(type: HookType, callback: AsyncHookCallback): void {
    const index = this.listeners_[type].indexOf(callback);
    if (index === -1) return;

    this.listeners_[type].splice(index, 1);
  }
  /* Error while processing download item */
  onError(callback: AsyncErrorCallback): void {
    if (this.errorListeners_.includes(callback)) return;
    this.errorListeners_.push(callback);
  }
  /* Removes error listener */
  removeErrorListener(callback: AsyncErrorCallback) {
    const index = this.errorListeners_.indexOf(callback);
    if (index === -1) return;

    this.errorListeners_.splice(index, 1);
  }
}
