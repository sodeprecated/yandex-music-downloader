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

type DownloadPartialCallback = (bytes: number, totalBytes: number) => void;

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

    return new Promise<Buffer>((resolve, reject) => {
      https
        .get(options, (res: IncomingMessage) => {
          const rawData: Buffer[] = [];
          const totalBytes = +(res.headers['content-length'] ?? -1);

          const minChunkSize = Math.max(Math.round(totalBytes / 500), 16384);
          let currentChunkBytes = 0;

          res.on('data', (chunk: Buffer) => {
            rawData.push(chunk);
            currentChunkBytes += chunk.byteLength;

            if (currentChunkBytes >= minChunkSize) {
              callback(currentChunkBytes, totalBytes);
              currentChunkBytes = 0;
            }
          });
          res.on('error', reject);
          res.on('end', () => {
            if (currentChunkBytes !== 0) {
              callback(currentChunkBytes, totalBytes);
            }
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
        (cur, total) => {
          downloadItem.size = total;
          downloadItem.downloadedSize += cur;

          /* EMIT progress */
          this.emit_('progress', downloadItem);
        }
      );

      downloadItem.state = DownloadItemState.COMPLETE;

      /* EMIT complete */
      this.emit_('complete', downloadItem);
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
    downloadPath = ''
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
    };

    this.downloadQueue_.push(downloadItem);

    this.emit_('add', downloadItem);

    this.queueProcessNext_();

    return downloadItem;
  }
  /**
   * NOT IMPLEMENTED
   *
   * Removes download item from queue. Stops downloading.
   * @return true if successeed
   */
  interrupt(_downloadItemId: number): boolean {
    throw new Error('Not implemented');
    return true;
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
   * @return current size of queue
   */
  size(): number {
    return this.downloadQueue_.length;
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
      await listener(item);
    }
  }
  /**
   * Emits error event passing to it target download item and error
   */
  private async emitError_(item: DownloadItem, err: Error) {
    for await (const errorListener of this.errorListeners_) {
      await errorListener(item, err);
    }
  }

  /* Hooks */
  on(type: HookType, callback: AsyncHookCallback): void {
    this.listeners_[type].push(callback);
  }
  /* Error while processing download item */
  onError(callback: AsyncErrorCallback): void {
    this.errorListeners_.push(callback);
  }
}
