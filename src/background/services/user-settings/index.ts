import {UserSettings as IUserSettings} from './interfaces';

export class UserSettings implements IUserSettings {
  /** Size of song cover */
  coverSize = 300;
  /**
   * Filename format. In curly brackets variables.
   * {title} - song title
   * {artist} - artist name
   * {album} - album title
   */
  filenameFormat = '{artist} - {title}';
  /** Download path relative to chrome's default download path*/
  downloadPath = '';
  /**
   * If true, when downloading album,
   * all songs will be saved to separate folder
   */
  downloadAlbumsInSeparateFolder = true;
  /**
   * If true, when downloading playlist,
   * all songs will be saved to separate folder
   */
  downloadPlaylistsInSeparateFolder = true;
  /**
   * If true, when downloading artist's song,
   * all songs will be saved to separate folder
   */
  downloadArtistsInSeparateFolder = true;
  /** Max amount of download items waiting for download. -1 for no limit */
  maxQueueSize = -1;
  /** Number of download items at the same time */
  concurrency = 2;

  constructor() {
    if (!chrome) return; // for test
    /**
     * Listen for any changes to the state of storage.
     * Update local settings
     */
    chrome.storage.onChanged.addListener(changes => {
      this.coverSize = changes.coverSize?.newValue ?? this.coverSize;
      this.filenameFormat =
        changes.filenameFormat?.newValue ?? this.filenameFormat;
      // this.downloadPath =
      //  changes.downloadPath?.newValue ?? this.downloadPath;
      this.downloadAlbumsInSeparateFolder =
        changes.downloadAlbumsInSeparateFolder?.newValue ??
        this.downloadAlbumsInSeparateFolder;
      this.downloadArtistsInSeparateFolder =
        changes.downloadArtistsInSeparateFolder?.newValue ??
        this.downloadArtistsInSeparateFolder;
      this.downloadPlaylistsInSeparateFolder =
        changes.downloadPlaylistsInSeparateFolder?.newValue ??
        this.downloadPlaylistsInSeparateFolder;
      this.maxQueueSize = changes.maxQueueSize?.newValue ?? this.maxQueueSize;
      this.concurrency = changes.concurrency?.newValue ?? this.concurrency;
    });
  }
  /**
   * Loads user settings from chrome storage
   */
  async load(): Promise<void> {
    if (!chrome) return; // for tests
    return new Promise<void>(resolve => {
      chrome.storage.sync.get(Object.keys(this), items => {
        this.coverSize = items.coverSize ?? this.coverSize;
        this.filenameFormat = items.filenameFormat ?? this.filenameFormat;
        // this.downloadPath = items.downloadPath ?? this.downloadPath;
        this.downloadAlbumsInSeparateFolder =
          items.downloadAlbumsInSeparateFolder ??
          this.downloadAlbumsInSeparateFolder;
        this.downloadArtistsInSeparateFolder =
          items.downloadArtistsInSeparateFolder ??
          this.downloadArtistsInSeparateFolder;
        this.downloadPlaylistsInSeparateFolder =
          items.downloadPlaylistsInSeparateFolder ??
          this.downloadPlaylistsInSeparateFolder;
        this.maxQueueSize = items.maxQueueSize ?? this.maxQueueSize;
        this.concurrency = items.concurrency ?? this.concurrency;
        resolve();
      });
    });
  }
  /**
   * Save current state of user settings.
   * Should be called every time something changes
   */
  async save(): Promise<void> {
    if (!chrome) return; // for tests
    return new Promise<void>(resolve => {
      chrome.storage.sync.set(this, resolve);
    });
  }
}
