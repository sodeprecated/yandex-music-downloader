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
};

export type HookType = 'add' | 'interrupted' | 'progress' | 'complete';
export type AsyncHookCallback = (item: DownloadItem) => Promise<void>;
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
   * Removes download item from queue. Stops downloading.
   * @return true if successeed
   */
  interrupt(downloadItemId: number): boolean;
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
   * @return current size of queue
   */
  size(): number;
  /**
   * @return number of items that is currently downloading
   */
  inProgressSize(): number;

  /* Hooks */
  on(type: HookType, callback: AsyncHookCallback): void;
  /* Error while processing download item */
  onError(callback: AsyncErrorCallback): void;
}
