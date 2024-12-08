"use strict";
document.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href !== '#') {
            // Navigate programmatically if needed
            window.location.href = href;
        }
        else {
            e.preventDefault(); // Only prevent default for invalid or dummy links
        }
    });
});
