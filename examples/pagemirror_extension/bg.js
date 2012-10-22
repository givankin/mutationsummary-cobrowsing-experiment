chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.create({ url: chrome.extension.getURL('mirror.html?tabId=' + tab.id) });
});