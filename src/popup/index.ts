import {DownloadItem} from '../background/services/download-manager/interfaces';
import {ChromeMessageType, ChromeMessage} from '../background/interfaces';
import {HTMLDownloadElement} from './download-element';

const port = chrome.runtime.connect({name: 'com'});

const addDownloadListenersMessage: ChromeMessage = {
  type: ChromeMessageType.ADD_DOWNLOAD_LISTENER,
};
port.postMessage(addDownloadListenersMessage);

const listDownloadItemsMessage: ChromeMessage = {
  type: ChromeMessageType.LIST_DOWNLOAD_ITEMS,
  items: [],
};
port.postMessage(listDownloadItemsMessage);

const downloadQueue = document.querySelector('download-queue')!;
const list: HTMLDownloadElement[] = [];

const createDownloadElement = (
  downloadQueue: Element,
  list: HTMLDownloadElement[],
  _port: chrome.runtime.Port,
  downloadItem: DownloadItem
) => {
  const element = new HTMLDownloadElement(downloadItem);
  list.push(element);
  downloadQueue.append(element);

  element.querySelector('.state i')!.addEventListener('click', () => {
    const message: ChromeMessage = {
      type: ChromeMessageType.INTERRUPT_DOWNLOAD,
      downloadItemId: downloadItem.id,
    };

    port.postMessage(message);
  });
  return element;
};

port.onMessage.addListener((message: ChromeMessage) => {
  switch (message.type) {
    case ChromeMessageType.DOWNLOAD_EVENT: {
      const item = list.find(
        el => el.downloadItem.id === message.downloadItem.id
      );
      if (item) {
        item.update(message.downloadItem);
      } else if (message.eventType === 'add') {
        createDownloadElement(downloadQueue, list, port, message.downloadItem);
      }
      break;
    }
    case ChromeMessageType.LIST_DOWNLOAD_ITEMS: {
      for (const item of message.items) {
        if (!list.find(el => el.downloadItem.id === item.id)) {
          createDownloadElement(downloadQueue, list, port, item);
        }
      }
      break;
    }
    default: {
      console.debug('wrong message type: ' + message.type);
      break;
    }
  }
});
