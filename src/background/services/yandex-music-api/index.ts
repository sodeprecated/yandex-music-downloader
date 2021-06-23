import https from 'https';
import {IncomingMessage} from 'http';
import md5 from 'md5';

import {
  Track,
  Album,
  Playlist,
  Artist,
  Lyric,
  YandexMusicAPI as IYandexMusicAPI,
} from './interfaces';

/**
 * Info about track's file
 */
type TrackDownloadInfo = {
  readonly codec: string /* should be mp3 */;
  readonly bitrate: number;
  readonly src: string;
  readonly gain: boolean;
  /* true if only preview version is available for you */
  readonly preview: boolean;
};
/**
 * Data needed to download file from storage
 */
type FileDownloadInfo = {
  readonly s: string;
  readonly ts: string;
  readonly path: string;
  readonly host: string;
};

/**
 * Implementation of yandex api functional
 */
export class YandexMusicAPI implements IYandexMusicAPI {
  protected locale_: string;
  protected headers_: {[header: string]: string};
  /**
   * @return hostname of current instance
   * of YandexMusicAPI
   */
  private getHostname(): string {
    return `music.yandex.${this.locale_}`;
  }
  /**
   * Does a GET request to specified path
   * @return parsed json casted to provided type
   */
  private async getObject<T>(path: string): Promise<T> {
    const options = {
      path: 'https://' + path,
      headers: {
        ...this.headers_,
        Accept: 'application/json',
      },
    };

    return new Promise<T>((resolve, reject) => {
      https
        .get(options, (res: IncomingMessage) => {
          let rawData = '';
          res.setEncoding('utf8');
          res.on('data', (chunk: string) => (rawData += chunk || ''));
          res.on('error', reject);
          res.on('end', () => resolve(JSON.parse(rawData)));
        })
        .on('error', reject);
    });
  }
  /**
   * Creates new instance of YandexMusicAPI with specified locale
   * @example new YandexMusicAPI('by')
   */
  constructor(locale = 'ru') {
    this.locale_ = locale;
    this.headers_ = {
      'X-Retpath-Y': encodeURI(`https://${this.getHostname()}/`),
      Connection: 'keep-alive',
      Accept: '*/*',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'origin, content-type, accept',
    };
  }
  /**
   * @return track info from '/handlers/track.jsx'
   */
  async getTrack(trackId: number): Promise<{
    readonly artists: Artist[];
    readonly otherVersions: {[version: string]: Track[]};
    readonly alsoInAlbums: Album[];
    readonly similarTracks: Track[];
    readonly track: Track;
    readonly lyric: Lyric[];
  }> {
    return await this.getObject(
      `${this.getHostname()}/handlers/track.jsx?track=${trackId}`
    );
  }
  /**
   * @return album info from '/handlers/album.jsx'
   */
  async getAlbum(albumId: number): Promise<Album> {
    return await this.getObject(
      `${this.getHostname()}/handlers/album.jsx?album=${albumId}`
    );
  }
  /**
   * @return artist info from '/handlers/artist.jsx'
   */
  async getArtist(artistId: number): Promise<{
    readonly artist: Artist;
    readonly similar: Artist[];
    readonly allSimilar: Artist[];
    readonly albums: Album[];
    readonly alsoAlbums: Album[];
    readonly tracks: Track[];
    readonly playlistIds: {
      readonly uid: number;
      readonly kind: number;
    }[];
    readonly playlists: Playlist[];
    readonly trackIds: number[];
  }> {
    return await this.getObject(
      `${this.getHostname()}/handlers/artist.jsx?artist=${artistId}`
    );
  }
  /**
   * @return playlist info from '/handlers/playlist.jsx'
   */
  async getPlaylist(
    uid: number | string,
    kind: number
  ): Promise<{playlist: Playlist}> {
    return await this.getObject(
      `${this.getHostname()}/handlers/playlist.jsx?owner=${uid}&kinds=${kind}`
    );
  }
  /**
   * @return link to track's mp3 file
   */
  async getTrackDownloadLink(trackId: number): Promise<string> {
    const trackDownloadApiPath =
      `/api/v2.1/handlers/track/${trackId}/` +
      'web-album-track-track-main/download/m?' +
      `hq=1&external-domain=${this.getHostname()}&` +
      `overembed=no&__t=${Date.now()}`;

    const trackDownloadInfo = await this.getObject<TrackDownloadInfo>(
      this.getHostname() + trackDownloadApiPath
    );

    const fileDownloadInfo = await this.getObject<FileDownloadInfo>(
      trackDownloadInfo.src.slice(2) + '&format=json'
    );

    const hasht = md5(
      'XGRlBW9FXlekgbPrRHuSiA' +
        fileDownloadInfo.path.substring(1) +
        fileDownloadInfo.s
    );
    const path =
      `/get-mp3/${hasht}/${fileDownloadInfo.ts}` +
      `${fileDownloadInfo.path}?track-id=${trackId}`;

    return 'https://' + fileDownloadInfo.host + path;
  }
  /**
   * @return link to covers
   */
  async getCoverDownloadLink(coverUri: string, size: number): Promise<string> {
    return 'https://' + coverUri.slice(0, -2) + `${size}x${size}`;
  }
}
