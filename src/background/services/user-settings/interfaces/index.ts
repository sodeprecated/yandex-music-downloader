export type UserSettingsFields =
  | 'coverSize'
  | 'filenameFormat'
  | 'downloadPath'
  | 'downloadAlbumsInSeparateFolder'
  | 'downloadPlaylistsInSeparateFolder'
  | 'downloadArtistsInSeparateFolder'
  | 'maxQueueSize';

export interface UserSettings {
  coverSize: number;
  filenameFormat: string;
  downloadPath: string;
  downloadAlbumsInSeparateFolder: boolean;
  downloadPlaylistsInSeparateFolder: boolean;
  downloadArtistsInSeparateFolder: boolean;
  maxQueueSize: number;
}
