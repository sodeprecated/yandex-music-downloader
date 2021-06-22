declare module 'browser-id3-writer' {
  import {Blob} from 'buffer';

  type StringArrayID3Tags =
    | 'TPE1' // song artists
    | 'TCOM' // song composers
    | 'TCON'; // song genres

  type StringID3Tags =
    | 'TLAN' // language
    | 'TIT1' // content group description
    | 'TIT2' // song title
    | 'TIT3' // song subtitle
    | 'TALB' // album title
    | 'TPE2' // album artist
    | 'TPE3' // conductor/performer refinement
    | 'TPE4' // interpreted, remixed, or otherwise modified by
    | 'TRCK' // song number in album: 5 or 5/10
    | 'TPOS' // album disc number: 1 or 1/3
    | 'TMED' // media type
    | 'TPUB' // label name
    | 'TCOP' // copyright
    | 'TKEY' // musical key in which the sound starts
    | 'TEXT' // lyricist / text writer
    | 'TSRC' // isrc

    // String(links)
    | 'WCOM' // Commercial information
    | 'WCOP' // Copyright/Legal information
    | 'WOAF' // Official audio file webpage
    | 'WOAR' // Official artist/performer webpage
    | 'WOAS' // Official audio source webpage
    | 'WORS' // Official internet radio station homepage
    | 'WPAY' // Payment
    | 'WPUB'; // Publishers official webpage

  type IntegerID3Tags =
    | 'TBPM' // beats per minute
    | 'TLEN' // song duration
    | 'TDAT' // album release date expressed as DDMM
    | 'TYER'; // album release year

  type ObjectID3Tags =
    // {language: string description: string lyrics: string}
    | 'USLT' // unsychronised lyrics

    // {type: integer, data: buffer, description: string}
    | 'APIC' // song cover

    // {description: string, value: string}
    | 'TXXX' // user defined text information

    // {language: string, description: string, text: string}
    | 'COMM' // Comments

    // {id: string, data: string}
    | 'PRIV'; // private frame

  export default class ID3Writer {
    public arrayBuffer: Buffer;

    constructor(buffer: Buffer);

    setFrame(frameName: StringArrayID3Tags, frameValue: string[]): this;
    setFrame(frameName: StringID3Tags, frameValue: string): this;
    setFrame(frameName: IntegerID3Tags, frameValue: number): this;
    setFrame(
      frameName: 'USLT',
      frameValue: {language?: string; description: string; lyrics: string}
    ): this;
    setFrame(
      frameName: 'APIC',
      frameValue: {
        type: number;
        data: Buffer;
        description: string;
        useUnicodeEncoding?: boolean;
      }
    ): this;
    setFrame(
      frameName: 'TXXX',
      frameValue: {description: string; value: string}
    ): this;
    setFrame(
      frameName: 'COMM',
      frameValue: {language?: string; description: string; text: string}
    ): this;
    setFrame(frameName: 'PRIV', frameValue: {id: string; data: Buffer}): this;

    removeTag(): void;
    addTag(): Buffer;

    getBlob(): Blob;
    getURL(): string;
    revokeURL(): void;
  }
}
