(function() {
    const savedTheme = localStorage.getItem('bitHabTheme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
})();
