// Manifest V3 兼容的 content script
console.log('Content script loaded');

// 与 background script 通信
function sendMessageToBackground(type, data = {}) {
  return chrome.runtime.sendMessage({
    type,
    ...data
  });
}

// 示例：获取书签
function getBookmarks() {
  return sendMessageToBackground('getBookmarks');
}

// 示例：获取存储数据
function getStorage(keys) {
  return sendMessageToBackground('getStorage', { keys });
}

// 示例：设置存储数据
function setStorage(data) {
  return sendMessageToBackground('setStorage', { data });
}

// 监听来自 background script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  // 处理消息
  switch (request.type) {
    case 'updateUI':
      // 更新页面UI
      console.log('Updating UI with:', request.data);
      break;
      
    default:
      console.log('Unknown message type:', request.type);
  }
  
  sendResponse({ success: true });
});

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
  console.log('Content script: DOM loaded');
  
  // 可以在这里添加页面特定的逻辑
  // 例如：修改页面内容、添加事件监听器等
});

// 导出函数供其他模块使用
window.contentScriptAPI = {
  getBookmarks,
  getStorage,
  setStorage,
  sendMessageToBackground
};
