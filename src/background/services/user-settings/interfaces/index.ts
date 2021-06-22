export type UserSettingsFields =
  | 'coverSize'
  | 'filenameFormat'
  | 'downloadPath'
  | 'downloadAlbumsInSeparateFolder'
  | 'downloadPlaylistsInSeparateFolder'
  | 'downloadArtistsInSeparateFolder'
  | 'maxQueueSize'
  | 'concurrency';

export interface UserSettings {
  coverSize: number;
  filenameFormat: string;
  downloadPath: string;
  downloadAlbumsInSeparateFolder: boolean;
  downloadPlaylistsInSeparateFolder: boolean;
  downloadArtistsInSeparateFolder: boolean;
  maxQueueSize: number;
  concurrency: number;
}
