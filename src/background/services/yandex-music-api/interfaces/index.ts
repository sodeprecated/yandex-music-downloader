enum TrackType {
  MUSIC = 'music',
  PODCAST_EPISODE = 'podcast-episode',
}

enum AlbumMetaType {
  MUSIC = 'music',
  PODCAST = 'podcast',
}

type Label = {
  readonly id: number;
  readonly name: string;
};

type Tag = {
  readonly id: number;
  readonly value: string;
};

/* Cover (Artist or Playlist) */
type BaseCover = {
  readonly type: string;
};

type FromAlbumCover = BaseCover & {
  readonly type: 'from-album-cover';
  /* <url>/%% instead '%%' paste image size e.g. 100x100 */
  readonly uri: string;
  readonly prefix: string;
};

type FromArtistPhotosCover = BaseCover & {
  readonly type: 'from-artist-photos';
  /* <url>/%% instead '%%' paste image size e.g. 100x100 */
  readonly uri: string;
  readonly prefix: string;
};

type MosaicCover = BaseCover & {
  readonly type: 'mosaic';
  /* <url>/%% instead '%%' paste image size e.g. 100x100 */
  readonly itemsUri: string[];
  readonly custom: boolean;
};

type PicCover = BaseCover & {
  readonly type: 'pic';
  readonly dir: string;
  readonly version: string;
  /* <url>/%% instead '%%' paste image size e.g. 100x100 */
  readonly uri: string;
  readonly custom: boolean;
};

type Cover = FromAlbumCover | FromArtistPhotosCover | MosaicCover | PicCover;

/* Artist Link */
type ArtistBaseLink = {
  readonly type: string;
  readonly title: string;
  readonly href: string;
};

type ArtistOfficialLink = ArtistBaseLink & {
  readonly type: 'official';
};

type ArtistSocialLink = ArtistBaseLink & {
  readonly type: 'social';
  readonly socialNetwork: string;
};

type ArtistLink = ArtistOfficialLink | ArtistSocialLink;

/* Main types */

export type Track = {
  readonly id: number;
  readonly realId: string;
  readonly title: string;
  readonly version?: string;
  readonly major: {
    readonly id: number;
    readonly name: string;
  };

  readonly available: boolean;
  readonly availableForPremiumUsers: boolean;
  readonly availableFullWithoutPermission: boolean;

  readonly durationMs: number;
  readonly storageDir: string;
  readonly fileSize: number;
  readonly normalization: {
    readonly gain: number /* float */;
    readonly peek: number /* float */;
  };
  readonly previewDurationMs: number;
  readonly artists: Pick<
    Artist,
    'id' | 'name' | 'various' | 'composer' | 'cover'
  >[];
  readonly albums: ({
    readonly trackPosition: {
      readonly volume: number;
      readonly index: number;
    };
    readonly volumes: undefined;
  } & Album)[];

  /* <url>/%% instead '%%' paste image size e.g. 100x100 */
  readonly coverUri: string;
  readonly ogImage: string;

  readonly lyricsAvailable: boolean;
  readonly type: TrackType /* probably smth els */;

  readonly rememberPosition: boolean;
  readonly trackSharingFlag: 'VIDEO_ALLOWED' /* TODO: check for other flags */;
  readonly batchId: string;
};

export type Album = {
  readonly id: number;
  readonly title: string;
  readonly metaType: AlbumMetaType;
  readonly contentWarning: 'explicit';

  readonly year: number;
  readonly releaseDate: string /* ISO Date */;

  /* <url>/%% instead '%%' paste image size e.g. 100x100 */
  readonly coverUri: string;
  readonly ogImage: string;

  readonly genre: string;

  readonly trackCount: number;
  readonly likesCount: number;

  readonly recent: boolean;
  readonly veryImportant: boolean;

  readonly artists: Pick<
    Artist,
    'id' | 'name' | 'various' | 'composer' | 'cover'
  >[];
  readonly labels: Label[];

  readonly available: boolean;
  readonly availableForPremiumUsers: boolean;
  readonly availableForMobile: boolean;
  readonly availablePartially: boolean;

  readonly bests: number[];

  readonly volumes: ({
    readonly albums: undefined;
  } & Track)[];
};

export type Playlist = {
  readonly revision: number;
  readonly kind: number;

  readonly title: string;
  readonly description: string;
  readonly descriptionFormatted: string;

  readonly trackCount: number;
  readonly visibility: 'public' | 'private';

  readonly cover: Cover;
  /* <url>/%% instead '%%' paste image size e.g. 100x100 */
  readonly ogImage: string;

  readonly owner: {
    readonly uid: number;
    readonly login: string;
    readonly name: string;
    readonly sex: 'male' | 'female';
    readonly verified: boolean;
    readonly avatarHash: string;
  };

  readonly tracks: Track[] /* maybe not all tracks */;
  readonly trackIds: number[] /* all track ids */;

  readonly modified: string /* ISO Date */;

  readonly tags: Tag[];

  readonly likesCount: number;
  readonly duration: number;

  readonly available: boolean;
};

export type Artist = {
  readonly id: number;
  readonly name: string;

  readonly various: boolean;
  readonly composer: boolean;

  readonly cover: Cover;
  readonly allCovers: Cover[];
  /* <url>/%% instead '%%' paste image size e.g. 100x100 */
  readonly ogImage: string;

  readonly genres: string[];

  readonly counts: {
    readonly tracks: number;
    readonly directAlbums: number;
    readonly alsoAlbums: number;
    readonly alsoTracks: number;
    readonly similarCount: number;
  };
  readonly likesCount: number;

  readonly available: boolean;

  readonly ratings: {
    readonly week: number;
    readonly month: number;
    readonly day: number;
  };

  readonly links: ArtistLink[];

  readonly ticketsAvailable: boolean;
};

export type Lyric = {
  readonly id: number;
  readonly lyrics: string;
  readonly fullLyrics: string;
  readonly hasRights: string;
  readonly textLanguage: string /* e.g. 'ru', 'en' */;
  readonly showTranslation: boolean;
};
