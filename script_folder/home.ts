"use strict";

document.querySelectorAll<HTMLAnchorElement>('.nav-link').forEach((link) => {
    link.addEventListener('click', (e: Event) => {
        const href = link.getAttribute('href');
        if (href && href !== '#') {
            // Navigate programmatically if needed
            window.location.href = href;
        } else {
            e.preventDefault(); // Only prevent default for invalid or dummy links
        }
    });
});

