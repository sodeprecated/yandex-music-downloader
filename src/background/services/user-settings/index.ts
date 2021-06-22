import {UserSettings as IUserSettings} from './interfaces';

export class UserSettings implements IUserSettings {
  coverSize = 200;
  filenameFormat = '{artist}-{title}';
  downloadPath = '/';
  downloadAlbumsInSeparateFolder = true;
  downloadPlaylistsInSeparateFolder = true;
  downloadArtistsInSeparateFolder = true;
  maxQueueSize = -1;

  constructor() {
    if (!chrome) return; // for test
    chrome.storage.sync.get(Object.keys(this), items => {
      this.coverSize = items.coverSize ?? this.coverSize;
      this.filenameFormat = items.filenameFormat ?? this.filenameFormat;
      this.downloadPath = items.downloadPath ?? this.downloadPath;
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
    });
    /**
     * Listen for any changes to the state of storage.
     * Update local settings.
     */
    chrome.storage.onChanged.addListener(changes => {
      this.coverSize = changes.coverSize.newValue ?? this.coverSize;
      this.filenameFormat =
        changes.filenameFormat.newValue ?? this.filenameFormat;
      this.downloadPath = changes.downloadPath.newValue ?? this.downloadPath;
      this.downloadAlbumsInSeparateFolder =
        changes.downloadAlbumsInSeparateFolder.newValue ??
        this.downloadAlbumsInSeparateFolder;
      this.downloadArtistsInSeparateFolder =
        changes.downloadArtistsInSeparateFolder.newValue ??
        this.downloadArtistsInSeparateFolder;
      this.downloadPlaylistsInSeparateFolder =
        changes.downloadPlaylistsInSeparateFolder.newValue ??
        this.downloadPlaylistsInSeparateFolder;
      this.maxQueueSize = changes.maxQueueSize.newValue ?? this.maxQueueSize;
    });
  }

  save(): void {
    if (!chrome) return; // for tests
    chrome.storage.sync.set(this);
  }
}
