let activeHost = null;
let lastTick = Date.now();

function hostFromUrl(url) {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

async function tick() {
  const now = Date.now();
  const elapsed = Math.floor((now - lastTick) / 1000);
  if (elapsed > 0 && activeHost) {
    chrome.storage.local.get(["siteTimes"], (data) => {
      const siteTimes = data.siteTimes || {};
      siteTimes[activeHost] = (siteTimes[activeHost] || 0) + elapsed;
      chrome.storage.local.set({ siteTimes });
    });
  }
  lastTick = now;
}

async function updateActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  activeHost = tab?.url ? hostFromUrl(tab.url) : null;
}

// Run tick every second
chrome.alarms.create("tickAlarm", { periodInMinutes: 1 / 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "tickAlarm") tick();
});

// Update active tab when switching
chrome.tabs.onActivated.addListener(updateActiveTab);
chrome.windows.onFocusChanged.addListener(updateActiveTab);
