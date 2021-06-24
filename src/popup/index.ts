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

port.onMessage.addListener((message: ChromeMessage) => {
  switch (message.type) {
    case ChromeMessageType.DOWNLOAD_EVENT: {
      const item = list.find(
        el => el.downloadItem.id === message.downloadItem.id
      );
      if (item) {
        item.update(message.downloadItem);
      } else if (message.eventType === 'add') {
        const element = new HTMLDownloadElement(message.downloadItem);
        list.push(element);
        downloadQueue.append(element);
      }
      break;
    }
    case ChromeMessageType.LIST_DOWNLOAD_ITEMS: {
      for (const item of message.items) {
        if (!list.find(el => el.downloadItem.id === item.id)) {
          const element = new HTMLDownloadElement(item);
          list.push(element);
          downloadQueue.append(element);
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
