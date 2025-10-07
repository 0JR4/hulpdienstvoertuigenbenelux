// scripts/loader.js
let loaderShowTime = null;
let hideRequested = false;

function showLoader() {
    const loader = document.querySelector('#showbox-holder');
    if (!loader) return;

    loader.style.display = 'flex'; 
    loader.classList.remove('fade-out');
    document.documentElement.style.overflow = 'hidden';
    loaderShowTime = Date.now();
    hideRequested = false;
}

function requestHideLoader() {
    hideRequested = true;
    attemptHideLoader();
}

function attemptHideLoader() {
    if (!hideRequested || !loaderShowTime) return;

    const elapsedTime = Date.now() - loaderShowTime;
    const minDuration = 500; 

    if (elapsedTime >= minDuration) {
        doHideLoader();
    } else {
        setTimeout(doHideLoader, minDuration - elapsedTime);
    }
}

function doHideLoader() {
    const loader = document.querySelector('#showbox-holder');
    if (!loader || loader.classList.contains('fade-out')) return;

    document.documentElement.style.overflow = '';

    if (typeof window.updateScrollbar === 'function') {
        window.updateScrollbar();
    }

    loader.classList.add('fade-out');

    setTimeout(() => {
        if (loader.parentNode) {
            loader.style.display = 'none';
        }
    }, 250); 
}

// Wait until DOM is ready before showing loader
document.addEventListener('DOMContentLoaded', showLoader);

// Hide loader automatically on all pages EXCEPT list.html
window.addEventListener('load', () => {
    const isListPage = window.location.pathname.endsWith('/list.html');
    if (!isListPage) {
        requestHideLoader();
    } else {

    }
});

// Make functions globally available
window.requestHideLoader = requestHideLoader;
window.showLoader = showLoader;
