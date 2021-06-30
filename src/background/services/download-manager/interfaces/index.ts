export enum DownloadItemState {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  INTERRUPTED = 'interrupted',
  COMPLETE = 'complete',
  ERROR = 'error',
}

export type DownloadItem = {
  id: number;
  name: string;

  state: DownloadItemState;

  filename: string;
  downloadPath: string;
  uri: string;

  bytes: Buffer | null;
  size: number;
  downloadedSize: number;

  startMs: number /* timestamp in ms */;

  customData?: {[key: string]: number | string | boolean | Buffer};
};

export type EventType = 'add' | 'interrupted' | 'progress' | 'complete';
export type AsyncEventCallback = (item: DownloadItem) => Promise<void>;
export type AsyncErrorCallback = (
  item: DownloadItem,
  err: Error
) => Promise<void>;

export interface DownloadManager {
  /**
   * Downloads file from provided uri and saves it
   */
  download(
    uri: string,
    name: string,
    filename: string,
    downloadPath?: string
  ): DownloadItem;
  /**
   * Stops downloading.
   * @return true if successeed
   */
  interrupt(downloadItemId: number): void;
  /**
   * Removes item from queue.
   */
  remove(downloadItemId: number): void;
  /**
   * Proceeds queue execution.
   */
  run(): void;
  /**
   * Stops queue execution. Doen't stop downloads in progress.
   * Only prevent new ones from being downloaded.
   */
  stop(): void;
  /**
   * Clears the queue. Removes from queue all elements that
   * are not being downloaded.
   */
  clear(): void;
  /**
   * @return current list of download items
   */
  list(): DownloadItem[];
  /**
   * @return current size of queue
   */
  size(): number;
  /**
   * @return number of items that is currently downloading
   */
  inProgressSize(): number;

  /* Hooks */
  on(type: EventType, callback: AsyncEventCallback): void;
  /* Error while processing download item */
  on(type: 'error', callback: AsyncErrorCallback): void;
  /* Removes hook */
  removeListener(type: EventType, callback: AsyncEventCallback): void;
  /* Removes error listener */
  removeListener(type: 'error', callback: AsyncErrorCallback): void;
}
