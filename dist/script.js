"use strict";
class InfiniteScrollGallery {
    constructor(galleryId, pictures, config = {}) {
        this.isLoading = false;
        const galleryElement = document.getElementById(galleryId);
        if (!galleryElement) {
            throw new Error(`Gallery element with ID "${galleryId}" not found.`);
        }
        this.gallery = galleryElement;
        this.pictures = pictures;
        this.loadedPictures = 0;
        this.batchSize = config.batchSize || 10;
        this.gridClasses = config.gridClasses || "col-12 col-sm-6 col-md-4 col-lg-3";
        this.observerOptions = config.observerOptions || { root: null, threshold: 0.1 };
        this.fallbackImage = config.fallbackImage;
        this.initialize();
    }
    initialize() {
        this.loadPictures(); // Initial batch load
        this.setupObserver(); // Setup infinite scrolling
    }
    loadPictures(count = this.batchSize) {
        if (this.isLoading)
            return;
        this.isLoading = true;
        // Simulate delay for better user experience
        setTimeout(() => {
            for (let i = 0; i < count; i++) {
                if (this.loadedPictures >= this.pictures.length)
                    break;
                const img = this.createImage(this.pictures[this.loadedPictures], `Picture ${this.loadedPictures + 1}`);
                const col = this.createColumn();
                col.appendChild(img);
                this.gallery.appendChild(col);
                this.loadedPictures++;
            }
            this.isLoading = false;
            // Dispatch events
            if (this.loadedPictures === this.pictures.length) {
                this.dispatchEvent("allImagesLoaded");
            }
            else {
                this.dispatchEvent("imageLoaded", { loadedPictures: this.loadedPictures });
            }
        }, 500); // Simulate delay
    }
    createImage(src, alt) {
        const img = document.createElement("img");
        img.src = src;
        img.alt = alt;
        img.className = "img-fluid gallery-img"; // Bootstrap and specific gallery styles
        img.loading = "lazy"; // Enable lazy loading for performance
        // Set fallback image in case of error
        img.onerror = () => {
            if (this.fallbackImage) {
                img.src = this.fallbackImage;
            }
        };
        return img;
    }
    createColumn() {
        const col = document.createElement("div");
        col.className = this.gridClasses; // Dynamic grid classes
        return col;
    }
    setupObserver() {
        const sentinel = document.createElement("div");
        sentinel.className = "sentinel";
        this.gallery.appendChild(sentinel);
        this.observer = new IntersectionObserver((entries) => {
            var _a;
            const lastEntry = entries[0];
            if (lastEntry.isIntersecting) {
                this.loadPictures();
                // Reuse sentinel if more images are available
                if (this.loadedPictures < this.pictures.length) {
                    this.gallery.appendChild(sentinel); // Move sentinel to the end
                }
                else {
                    (_a = this.observer) === null || _a === void 0 ? void 0 : _a.disconnect(); // Stop observing when all images are loaded
                }
            }
        }, this.observerOptions);
        if (this.observer) {
            this.observer.observe(sentinel);
        }
    }
    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, { detail });
        this.gallery.dispatchEvent(event);
    }
    filterPictures(keyword) {
        const filtered = this.pictures.filter((url) => url.includes(keyword));
        this.gallery.innerHTML = ""; // Clear gallery
        this.loadedPictures = 0;
        this.pictures = filtered;
        this.loadPictures();
    }
    updateGridClasses(newClasses) {
        this.gridClasses = newClasses;
        const columns = this.gallery.querySelectorAll(".col");
        columns.forEach((col) => {
            col.className = newClasses; // Update existing column classes
        });
    }
}
// Example usage
document.addEventListener("DOMContentLoaded", () => {
    const pictures = Array.from({ length: 100 }, (_, i) => `../images/image${i + 1}.jpg`);
    const galleryConfig = {
        batchSize: 15,
        gridClasses: "col-12 col-sm-6 col-md-4 col-lg-3",
        observerOptions: { root: null, threshold: 0.1 },
        fallbackImage: "../images/fallback.jpg",
    };
    const gallery = new InfiniteScrollGallery("gallery", pictures, galleryConfig);
    // Optional: Listen to events
    const galleryElement = document.getElementById("gallery");
    galleryElement.addEventListener("imageLoaded", (e) => {
        console.log("Image Loaded:", e.detail.loadedPictures);
    });
    galleryElement.addEventListener("allImagesLoaded", () => {
        console.log("All images loaded!");
    });
});
