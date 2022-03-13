import {ChromeMessageType, ChromeMessage} from '../background/interfaces';

const DEBOUNCE_TIMEOUT = 1000;

const locale = (() => {
  const domains = window.location.host.split('.');
  return domains[domains.length - 1];
})();
const port = chrome.runtime.connect({name: locale});

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func: Function, wait: number, immediate?: boolean) {
  let timeout: NodeJS.Timeout | null;
  return function (this: Function) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this,
      // eslint-disable-next-line prefer-rest-params
      args = arguments;
    const later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout!);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

const downloadTrack = (trackId: number | string) => {
  const message: ChromeMessage = {
    type: ChromeMessageType.DOWNLOAD_TRACK,
    trackId: +trackId,
  };

  port.postMessage(message);
};

const downloadAlbum = (albumId: number | string) => {
  const message: ChromeMessage = {
    type: ChromeMessageType.DOWNLOAD_ALBUM,
    albumId: +albumId,
  };
  port.postMessage(message);
};

const downloadArtist = (artistId: number | string) => {
  const message: ChromeMessage = {
    type: ChromeMessageType.DOWNLOAD_ARTIST,
    artistId: +artistId,
  };
  port.postMessage(message);
};

const downloadPlaylist = (owner: number | string, kind: number | string) => {
  const message: ChromeMessage = {
    type: ChromeMessageType.DOWNLOAD_PLAYLIST,
    owner,
    kind: +kind,
  };
  port.postMessage(message);
};

const sidebarContainsTracks = () => {
  // multiple sidebars onfront each other
  const allSidebars = document.querySelectorAll('.sidebar-cont');
  if (!allSidebars.length) return false;
  // get the one on the top
  const sidebar = allSidebars[allSidebars.length - 1];
  return sidebar.querySelectorAll('.sidebar__tracks .d-track').length > 0;
};

const getTrackIdFromElement = (element: Element): number | null => {
  const a = element.querySelector('.d-track__name a');
  if (!a) return null;

  const url = a.getAttribute('href')!;
  return +url.split('/')[4];
};

const addTrackIcons = (trackElements: NodeListOf<Element>) => {
  trackElements.forEach(trackElement => {
    if (trackElement.querySelector('.YMD-icon')) return;
    const actions = trackElement.querySelector('.d-track__actions')!;
    const icon = document.createElement('span');

    const trackId = getTrackIdFromElement(trackElement);
    if (!trackId) return;

    icon.classList.add('YMD-icon', 'sidebar__track_YMD-icon');
    const dark = document.body.classList.contains('theme-black');
    if (dark) {
      icon.classList.add('YMD-icon-dark');
    } else {
      icon.classList.add('YMD-icon-light');
    }

    icon.addEventListener('click', () => {
      downloadTrack(trackId);
    });
    icon.title = 'Загрузить';
    actions.prepend(icon);
  });
};

const addPlayerIcon = () => {
  const par = document.querySelector('.player-controls__seq-controls')!;
  const parPodcast = document.querySelector(
    '.player-controls__speed-controls'
  )!;
  const div = document.createElement('div');
  const icon = document.createElement('span');
  icon.classList.add('YMD-icon', 'player__YMD_icon');
  div.classList.add(
    'player-controls__btn',
    'deco-player-controls__button',
    'player-controls__btn_download'
  );

  div.title = 'Загрузить текущий трек';

  const dark = document.body.classList.contains('theme-black');
  if (dark) {
    icon.classList.add('YMD-icon-dark');
  } else {
    icon.classList.add('YMD-icon-light');
  }

  div.appendChild(icon);
  par.appendChild(div);
  parPodcast.appendChild(div.cloneNode(true));

  par.querySelector('.player-controls__btn_download span')!.addEventListener(
    'click',
    debounce(() => {
      const a = document.querySelector('.player-controls .track__name a')!;
      const url = a.getAttribute('href')!;
      downloadTrack(+url.split('/')[4]);
    }, DEBOUNCE_TIMEOUT)
  );

  parPodcast
    .querySelector('.player-controls__btn_download span')!
    .addEventListener(
      'click',
      debounce(() => {
        const a = document.querySelector('.player-controls .track__name a')!;
        const url = a.getAttribute('href')!;
        downloadTrack(+url.split('/')[4]);
      }, DEBOUNCE_TIMEOUT)
    );
};

const addSidebarIcons = () => {
  const allSidebars = document.querySelectorAll('.sidebar-cont');
  const sidebar = allSidebars[allSidebars.length - 1];
  const sidebarControls = sidebar.querySelector('.sidebar__controls')!;
  const sidebarTracks = sidebar.querySelectorAll('.sidebar__tracks .d-track');

  addTrackIcons(sidebarTracks);

  // check if icon is set already
  if (sidebarControls.querySelector('.sidebar__YMD-icon')) return;
  // skip sidebar with artists tracks
  if (sidebar.querySelector('.sidebar-artist')) return;

  const button = document.createElement('button');
  const inner1 = document.createElement('span');
  const inner2 = document.createElement('span');
  const icon = document.createElement('span');
  button.classList.add(
    'd-button',
    'deco-button',
    'deco-button-transparent',
    'd-button_rounded',
    'd-button_size_L',
    'd-button_w-icon',
    'd-button_w-icon-centered',
    'sidebar__YMD-button'
  );
  inner1.classList.add('d-button-inner', 'deco-button-stylable');
  inner2.classList.add('d-button__inner');
  icon.classList.add('YMD-icon', 'sidebar__YMD-icon');
  button.title = 'Загрузить';
  const dark = document.body.classList.contains('theme-black');
  if (dark) {
    icon.classList.add('YMD-icon-dark');
  } else {
    icon.classList.add('YMD-icon-light');
  }
  inner2.append(icon);
  inner1.append(inner2);
  button.append(inner1);

  button.addEventListener(
    'click',
    debounce(() => {
      const a = sidebar.querySelector('.sidebar__title a');
      if (!a) return;

      const parts = a.getAttribute('href')!.split('/');
      if (parts.length === 5) {
        if (sidebar.querySelector('.sidebar-track ')) {
          /* only track */
          downloadTrack(parts[4]);
          return;
        }
        /* playlist */
        downloadPlaylist(parts[2], parts[4]);
      } else if (parts.length === 3) {
        /* album */
        downloadAlbum(parts[2]);
      }
    }, DEBOUNCE_TIMEOUT)
  );
  sidebarControls.append(button);
};

const addCenterblockTrackIcons = () => {
  const centerblock = document.querySelector('.centerblock');
  if (!centerblock) return;

  const tracks = centerblock.querySelectorAll('.d-track');

  tracks.forEach(trackElement => {
    if (trackElement.querySelector('.YMD-icon')) return;
    const actions = trackElement.querySelector('.d-track__actions')!;
    const icon = document.createElement('span');

    const trackId = getTrackIdFromElement(trackElement);
    if (!trackId) return;

    icon.classList.add('YMD-icon', 'page__track_YMD-icon');
    const dark = document.body.classList.contains('theme-black');
    if (dark) {
      icon.classList.add('YMD-icon-dark');
    } else {
      icon.classList.add('YMD-icon-light');
    }

    icon.addEventListener('click', () => {
      downloadTrack(trackId);
    });
    icon.title = 'Загрузить';
    actions.prepend(icon);
  });
};

const addArtistPageIcons = (artistPage: Element) => {
  addCenterblockTrackIcons();
  addPageDownloadButton(
    artistPage,
    '.d-generic-page-head__main-actions',
    () => {
      const parts = window.location.pathname.split('/');
      downloadArtist(parts[2]);
    }
  );
};

const addAlbumPageIcons = (albumPage: Element) => {
  addCenterblockTrackIcons();
  addPageDownloadButton(
    albumPage,
    '.d-generic-page-head__main-actions',
    () => {
      const parts = window.location.pathname.split('/');
      downloadAlbum(parts[2]);
    }
  );
};

const addPlaylistPageIcons = (playlistPage: Element) => {
  addCenterblockTrackIcons();
  addPageDownloadButton(
    playlistPage,
    '.page-playlist__controls',
    () => {
      const parts = window.location.pathname.split('/');
      downloadPlaylist(parts[2], parts[4]);
    }
  );
};

const addPageDownloadButton = (
  page: Element,
  buttonContainerSelector: string,
  callback: Function
) => {
  const buttonContainer = page.querySelector(buttonContainerSelector)!;

  if (buttonContainer.querySelector('.YMD-icon')) return;

  const button = document.createElement('button');
  const inner1 = document.createElement('span');
  const inner2 = document.createElement('span');
  const icon = document.createElement('span');
  button.classList.add(
    'd-button',
    'deco-button',
    'deco-button-transparent',
    'd-button_rounded',
    'd-button_size_L',
    'd-button_w-icon',
    'd-button_w-icon-centered',
    'page__YMD-button'
  );
  inner1.classList.add('d-button-inner', 'deco-button-stylable');
  inner2.classList.add('d-button__inner');
  icon.classList.add('YMD-icon', 'page__YMD-icon');
  button.title = 'Загрузить';
  const dark = document.body.classList.contains('theme-black');
  if (dark) {
    icon.classList.add('YMD-icon-dark');
  } else {
    icon.classList.add('YMD-icon-light');
  }
  inner2.append(icon);
  inner1.append(inner2);
  button.append(inner1);

  button.addEventListener('click', debounce(callback, DEBOUNCE_TIMEOUT));

  buttonContainer.append(button);
};

const removeSidebarIcons = () => {
  const sidebars = document.querySelectorAll('.sidebar-cont');
  if (!sidebars.length) return;
  const sidebar = sidebars[sidebars.length - 1];
  const toRemove = sidebar.querySelector('.sidebar__YMD-button');
  if (!toRemove) return;
  toRemove.parentNode!.removeChild(toRemove);
};

(function observeDarkTheme() {
  const targetNode = document.body;
  const config = {attributes: true, childList: false, subtree: false};
  const observer = new MutationObserver(() => {
    const icons = document.querySelectorAll('.YMD-icon');
    const dark = document.body.classList.contains('theme-black');
    icons.forEach(icon => {
      if (dark) {
        icon.classList.remove('YMD-icon-light');
        icon.classList.add('YMD-icon-dark');
      } else {
        icon.classList.remove('YMD-icon-dark');
        icon.classList.add('YMD-icon-light');
      }
    });
  });
  observer.observe(targetNode, config);
})();

(function observePlayer() {
  const targetNode = document.body;
  const config = {attributes: false, childList: true, subtree: true};
  const observer = new MutationObserver((_mutationsList, observer) => {
    if (
      document.querySelector('.player-controls__seq-controls') &&
      document.querySelector('.player-controls__speed-controls')
    ) {
      addPlayerIcon();
      observer.disconnect();
    }
  });
  observer.observe(targetNode, config);
})();

(function observeSidebar() {
  const targetNode = document.querySelector('.sidebar')!;
  const config = {attributes: false, childList: true, subtree: true};

  const observer = new MutationObserver(() => {
    if (sidebarContainsTracks()) {
      addSidebarIcons();
    } else {
      removeSidebarIcons();
    }
  });
  observer.observe(targetNode, config);
})();

(function observeCenterblock() {
  const targetNode = document.body;
  const config = {attributes: false, childList: true, subtree: true};

  const observer = new MutationObserver(() => {
    const artistPage = document.querySelector('.page-artist');
    if (artistPage) {
      addArtistPageIcons(artistPage);
      return;
    }

    const albumPage = document.querySelector('.page-album');
    if (albumPage) {
      addAlbumPageIcons(albumPage);
      return;
    }

    const chartPage = document.querySelector('.page-main__chart');
    if (chartPage) {
      addCenterblockTrackIcons();
      return;
    }

    const metatagPage = document.querySelector('.page-metatag');
    if (metatagPage) {
      addCenterblockTrackIcons();
      return;
    }

    const playlistPage = document.querySelector('.page-playlist');
    if (playlistPage) {
      addPlaylistPageIcons(playlistPage);
      return;
    }
  });
  observer.observe(targetNode, config);
})();
