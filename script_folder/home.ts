// Select all elements with the class 'nav-link'
document.querySelectorAll('.nav-link').forEach((link) => {
    // Ensure the link element is properly typed
    link.addEventListener('click', (e: Event) => {
        e.preventDefault(); // Prevent the default navigation behavior
    });
});
