// Manifest V3 兼容的 background script
console.log('Background script loaded for Manifest V3');

// 监听来自 content script 的消息
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request);
  console.log('From:', sender);
  
  // 处理不同类型的消息
  switch (request.type) {
    case 'getBookmarks':
      // 获取书签
      browser.bookmarks.getTree().then(bookmarks => {
        sendResponse({ success: true, bookmarks });
      }).catch(error => {
        console.error('Error getting bookmarks:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true; // 保持消息通道开放
      
    case 'getStorage':
      // 获取存储数据
      browser.storage.local.get(request.keys).then(data => {
        sendResponse({ success: true, data });
      }).catch(error => {
        console.error('Error getting storage:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
      
    case 'setStorage':
      // 设置存储数据
      browser.storage.local.set(request.data).then(() => {
        sendResponse({ success: true });
      }).catch(error => {
        console.error('Error setting storage:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
      
    default:
      // 默认响应
      sendResponse({ success: true, message: 'Message received' });
      return false;
  }
});

// 监听扩展安装事件
browser.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details.reason);
  
  // 如果是首次安装，可以设置一些默认数据
  if (details.reason === 'install') {
    browser.storage.local.set({
      installedAt: new Date().toISOString(),
      version: browser.runtime.getManifest().version
    });
  }
});

// 监听标签页更新事件
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Tab updated:', tab.url);
  }
});

// 监听扩展启动事件
browser.runtime.onStartup.addListener(() => {
  console.log('Extension started');
});
