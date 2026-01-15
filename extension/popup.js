document.addEventListener('DOMContentLoaded', function () {
    var toggle = document.getElementById('toggle');

    // Load saved state
    chrome.storage.sync.get(['enabled'], function (result) {
        if (result.enabled !== undefined) {
            toggle.checked = result.enabled;
        } else {
            toggle.checked = true; // Default to true
        }
    });

    // Save state on change
    toggle.addEventListener('change', function () {
        chrome.storage.sync.set({ enabled: toggle.checked });
    });
});
