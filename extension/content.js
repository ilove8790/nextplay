// NextPlay Auto - Content Script
console.log("NextPlay Auto: Extension Loaded");

// 설정 변수
let isEnabled = true;
let videoElement = null;
let observer = null;

// 스토리지에서 설정 불러오기
chrome.storage.sync.get(['enabled'], function (result) {
    if (result.enabled !== undefined) {
        isEnabled = result.enabled;
    }
    if (isEnabled) {
        startAutomation();
    }
});

// 설정 변경 감지
chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (changes.enabled) {
        isEnabled = changes.enabled.newValue;
        if (isEnabled) {
            console.log("NextPlay Auto: Enabled");
            startAutomation();
        } else {
            console.log("NextPlay Auto: Disabled");
            stopAutomation();
        }
    }
});

function startAutomation() {
    // 1초마다 비디오 상태 체크 및 동작 수행
    if (!observer) {
        observer = setInterval(checkVideoAndAct, 1000);
    }
}

function stopAutomation() {
    if (observer) {
        clearInterval(observer);
        observer = null;
    }
}

function checkVideoAndAct() {
    if (!isEnabled) return;

    // 1. 비디오 요소 찾기
    const video = document.querySelector('video');

    if (!video) return; // 비디오가 없으면 대기

    // 비디오가 변경되었는지 확인 (새로운 비디오 로드 시 이벤트 리스너 다시 부착)
    if (video !== videoElement) {
        videoElement = video;
        console.log("NextPlay Auto: Video element found", video);

        // 종료 이벤트 리스너 부착
        video.addEventListener('ended', handleVideoEnded);
    }

    // 2. 자동 재생 (Auto Play)
    if (video.paused && !video.ended && video.readyState > 2) {
        attemptAutoPlay(video);
    }
    // 3. 팝업 확인 버튼 감지 (비디오 상태와 무관하게 언제든 뜰 수 있음)
    handleConfirmPopup();
}

function attemptAutoPlay(video) {
    console.log("NextPlay Auto: Attempting to play...");

    // 2-1. 마우스 오버 시뮬레이션 (버튼이 나타나게 하기 위해)
    const mouseEvent = new MouseEvent('mousemove', {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: video.getBoundingClientRect().left + 100,
        clientY: video.getBoundingClientRect().top + 100
    });
    video.dispatchEvent(mouseEvent);
    video.parentElement.dispatchEvent(mouseEvent);

    // 2-2. 비디오 자체 재생 시도
    // 일부 사이트는 video.play()를 막지 않음
    video.play().then(() => {
        console.log("NextPlay Auto: Played via video.play()");
    }).catch(() => {
        // video.play() 실패 시 (사용자 상호작용 필요 등), 버튼 클릭 시도
        clickPlayButton();
    });
}

// SVG Path based detection helper
function hasPath(element, d) {
    if (!element) return false;
    const paths = element.querySelectorAll('path');
    for (let p of paths) {
        if (p.getAttribute('d') === d) return true;
    }
    return false;
}

function clickPlayButton() {
    // Strategy 1: Look for the specific SVG path of the play icon (based on user HTML)
    const playIconPath = "M8 5v14l11-7z";

    const svgs = document.querySelectorAll('svg');
    for (let svg of svgs) {
        if (hasPath(svg, playIconPath)) {
            // User HTML structure: <div class="vbW..."><svg...>...</svg></div>
            // The clickable element is likely the container div or one of its parents.
            // We search up for a likely clickable container or just click the parent.
            let clickable = svg.closest('div[class*="vbWCla"]');
            if (!clickable) clickable = svg.parentElement;

            if (clickable && clickable.offsetParent !== null) {
                console.log("NextPlay Auto: Clicking Play Button (SVG Match)", clickable);
                clickable.click();
                return;
            }
        }
    }

    // Strategy 2: Fallback to existing logic
    const selectors = [
        '.vjs-big-play-button',
        '.ytp-play-button',
        'div[class*="play"]',
        '.play-icon'
    ];

    for (let selector of selectors) {
        const btn = document.querySelector(selector);
        if (btn && btn.offsetParent !== null) {
            console.log(`NextPlay Auto: Clicking play button (${selector})`);
            btn.click();
            return;
        }
    }
}

function handleVideoEnded() {
    if (!isEnabled) return;
    console.log("NextPlay Auto: Video Ended. Attempts to click Next...");

    // Attempt repeatedly to ensuring clicking happens even if the DOM updates slowly
    let attempts = 0;
    const interval = setInterval(() => {
        attempts++;
        if (clickNextButton() || attempts > 10) {
            // Next button clicked or timed out.
            // Even if clicked, we might need to handle the popup that appears AFTER click.
            // The checkVideoAndAct loop handles the popup globally, but we can also check here explicitly.
        }
        if (attempts > 10) clearInterval(interval);
    }, 1000);
}

function handleConfirmPopup() {
    // User Provided Confirm Button:
    // <button onclick="video_confirm()" style="...">확인</button>

    // Strategy: Look for button with specific text and onclick attribute (if accessible)
    // Note: checking onclick attribute directly in DOM might return null if attached via JS,
    // but here it seems inline.

    // 1. onclick + text match
    const buttons = document.querySelectorAll('button');
    for (let btn of buttons) {
        if (btn.innerText.trim() === '확인') {
            const onclickAttr = btn.getAttribute('onclick');
            if (onclickAttr && onclickAttr.includes('video_confirm')) {
                console.log("NextPlay Auto: Clicking Confirm Popup Button");
                btn.click();
                return true;
            }

            // Fallback: If style matches specific color #f44f7e
            const style = window.getComputedStyle(btn);
            if (style.backgroundColor === 'rgb(244, 79, 126)') { // #f44f7e
                console.log("NextPlay Auto: Clicking Confirm Popup Button (Color Match)");
                btn.click();
                return true;
            }
        }
    }
    return false;
}

function clickNextButton() {
    // Strategy 1: Exact match for user provided button
    // <button class="next">Next</button>
    const nextBtn = document.querySelector('button.next');
    if (nextBtn && nextBtn.innerText.trim().includes('Next')) {
        console.log("NextPlay Auto: Clicking User Provided Next Button (.next)");
        nextBtn.click();
        return true;
    }

    // Strategy 2: Text search fallback
    const buttons = document.querySelectorAll('button, a');
    for (let btn of buttons) {
        const text = btn.innerText.trim().toLowerCase();
        if (text === 'next' || text === '다음') {
            console.log("NextPlay Auto: Clicking Next button (Text matched)", btn);
            btn.click();
            return true;
        }
    }

    console.log("NextPlay Auto: Next button not found yet.");
    return false;
}
