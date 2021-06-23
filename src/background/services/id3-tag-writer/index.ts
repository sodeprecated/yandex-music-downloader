import ID3Writer from 'browser-id3-writer';
import {ISO6391ToISO6392Converter} from './iso6391-to-iso6392';

export class TrackID3TagWriter {
  protected songBuffer_: Buffer;
  protected id3Writer_: ID3Writer;
  protected languageConverter_: ISO6391ToISO6392Converter;

  constructor(songBuffer: Buffer) {
    /* Doesnt create a copy, just reference */
    this.songBuffer_ = songBuffer;
    this.id3Writer_ = new ID3Writer(this.songBuffer_);
    this.languageConverter_ = new ISO6391ToISO6392Converter('eng');
  }
  /**
   * Sets song title
   */
  setTitle(title: string): this {
    this.id3Writer_.setFrame('TIT2', title);
    return this;
  }
  /**
   * Sets song version.
   * e.g. remastered, cover, acoustic etc.
   */
  setVersion(version: string): this {
    this.id3Writer_.setFrame('TIT3', version);
    return this;
  }
  /**
   * Sets song language.
   * Language must be coded following the ISO 639-2 standards
   */
  setLanguage(language: string): this {
    this.id3Writer_.setFrame('TLAN', this.languageConverter_.convert(language));
    return this;
  }
  /**
   * Sets song duration in milliseconds
   */
  setDuration(duration: number): this {
    this.id3Writer_.setFrame('TLEN', duration);
    return this;
  }
  /**
   * Sets type of track.
   * e.g. song, music
   */
  setType(type: string): this {
    this.id3Writer_.setFrame('TMED', type);
    return this;
  }
  /**
   * Sets genre of the song.
   * e.g. rock pop electro
   */
  setGenre(genre: string): this {
    this.id3Writer_.setFrame('TCON', [genre]);
    return this;
  }
  /**
   * Sets name of the album's label
   */
  setLabel(label: string): this {
    this.id3Writer_.setFrame('TPUB', label);
    return this;
  }
  /**
   * Sets lyric of the song.
   * Language must be coded following the ISO 639-2 standards
   */
  setLyric(lyrics: string, description: string, language?: string): this {
    this.id3Writer_.setFrame('USLT', {
      lyrics,
      description,
      language: this.languageConverter_.convert(language || 'en'),
    });
    return this;
  }
  /**
   * Sets cover of the song.
   * Image data must be in buffer format
   */
  setCover(data: Buffer, description: string): this {
    this.id3Writer_.setFrame('APIC', {
      type: 3,
      data,
      description,
    });
    return this;
  }
  /**
   * Sets artists of the song as an array of strings
   */
  setArtists(artists: string[]): this {
    this.id3Writer_.setFrame('TPE1', artists);
    return this;
  }
  /**
   * Sets information about the song's album
   */
  setAlbum(album: {title?: string; artist?: string; year?: number}): this {
    if (album.title) this.id3Writer_.setFrame('TALB', album.title);
    if (album.artist) this.id3Writer_.setFrame('TPE2', album.artist);
    if (album.year) this.id3Writer_.setFrame('TYER', album.year);
    return this;
  }
  /**
   * Sets track position in specific album or playlist.
   * For album its 'track.album[0].trackPosition.index'.
   * For playlist its 'playlist.trackIds.indexOf(+track.id)'
   */
  setPositionInAlbum(position: number): this {
    this.id3Writer_.setFrame('TRCK', position.toString());
    return this;
  }
  /**
   * Sets disk index of the song's album
   */
  setVolume(volume: number): this {
    this.id3Writer_.setFrame('TPOS', volume.toString());
    return this;
  }
  /**
   * @return track in buffer format. Buffer will share the
   * same allocated space as the buffer provided in constructor.
   */
  getTrack(): Buffer {
    this.id3Writer_.addTag();
    return Buffer.from(this.id3Writer_.arrayBuffer);
  }
  /**
   * Creates local url of file
   */
  getUrl(): string {
    this.id3Writer_.addTag();
    return this.id3Writer_.getURL();
  }
  /**
   * Revokes url that was created earlier
   */
  revokeUrl(): void {
    this.id3Writer_.revokeURL();
  }
}
