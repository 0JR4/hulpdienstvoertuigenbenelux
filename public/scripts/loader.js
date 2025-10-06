function hideLoader() {
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
