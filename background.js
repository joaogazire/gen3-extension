/* Emerald TCG Finder - Background Script */

browser.runtime.onMessage.addListener((message, sender) => {
  if (message.action === 'updateBadge') {
    browser.browserAction.setBadgeText({
      text: message.count > 0 ? message.count.toString() : '',
      tabId: sender.tab.id
    });
    browser.browserAction.setBadgeBackgroundColor({
      color: '#0f4b3c',
      tabId: sender.tab.id
    });
  }
});

browser.runtime.onInstalled.addListener(() => {
  console.log('[Emerald TCG] Extensão instalada');
});
