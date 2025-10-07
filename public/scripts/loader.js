
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
