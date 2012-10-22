var mirroring = false;
var activeTab;
var windowId;

chrome.browserAction.onClicked.addListener(function(tab) {
    if (mirroring) {
        chrome.tabs.executeScript(activeTab, { code: 'stopMirroring();' });
        mirroring = false;
        activeTab = undefined;
        windowId = undefined;
    } else {
        mirroring = true;
        windowId = tab.windowId;
        mirrorTab(tab.id);
    }
});

function mirrorTab(tabId) {
    if (tabId == activeTab)
        return;

    if (activeTab)
        chrome.tabs.executeScript(activeTab, { code: 'stopMirroring();' });

    activeTab = tabId;

    chrome.tabs.executeScript(activeTab, { code: 'startMirroring();' });
}

chrome.tabs.onActiveChanged.addListener(function(tabId, selectInfo) {
    if (!mirroring)
        return;

    if (selectInfo.windowId != windowId)
        return;

    mirrorTab(tabId);
});

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    if (!mirroring || sender.tab.id !== activeTab)
        sendResponse({ mirror: false });
    else
        sendResponse({ mirror: true });
});