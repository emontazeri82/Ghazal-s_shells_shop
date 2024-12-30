export class InfiniteScrollGallery {
    constructor(galleryId, cart, pictures, config = {}) {
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
        this.cart = cart;
        this.initialize();
    }
    initialize() {
        this.loadPictures();
        this.setupObserver();
    }
    loadPictures(count = this.batchSize) {
        if (this.isLoading)
            return;
        this.isLoading = true;
        setTimeout(() => {
            const start = this.loadedPictures;
            const end = Math.min(this.loadedPictures + count, this.pictures.length);
            console.log(`Loading pictures from index ${start} to ${end - 1}`);
            for (let i = start; i < end; i++) {
                const picture = this.pictures[i];
                const col = this.createColumn(picture);
                this.gallery.appendChild(col);
            }
            this.loadedPictures = end;
            this.isLoading = false;
            const sentinel = this.gallery.querySelector(".sentinel");
            if (sentinel) {
                this.gallery.appendChild(sentinel);
            }
            if (this.loadedPictures === this.pictures.length && this.observer) {
                console.log("All pictures loaded. Disconnecting observer.");
                this.observer.disconnect();
            }
        }, 500);
    }
    createColumn(picture) {
        const col = this.createElement("div", `${this.gridClasses}`);
        const img = this.createImage(picture.src, picture.name || `Picture ${picture.id}`);
        const nameLabel = this.createElement("p", "text-center mt-2", picture.name);
        const priceLabel = this.createElement("p", "text-center mt-1", `$${picture.price?.toFixed(2)}`);
        const addToCartButton = this.createButton("Add to Cart", "btn btn-primary btn-sm add-to-cart-button", () => this.cart.addToCart(picture.id, picture.src, picture.name, picture.price), picture.stock === 0);
        col.append(img, nameLabel, priceLabel, addToCartButton);
        return col;
    }
    createImage(src, alt) {
        const img = document.createElement("img");
        img.src = src;
        img.alt = alt;
        img.className = "img-fluid gallery-img";
        img.loading = "lazy";
        img.onerror = () => {
            if (this.fallbackImage) {
                console.log(`Image failed to load. Using fallback: ${this.fallbackImage}`);
                img.src = this.fallbackImage;
            }
        };
        return img;
    }
    setupObserver() {
        const sentinel = this.createElement("div", "sentinel");
        this.gallery.appendChild(sentinel);
        this.observer = new IntersectionObserver((entries) => {
            const lastEntry = entries[0];
            if (lastEntry.isIntersecting) {
                console.log("Sentinel is visible. Loading more pictures...");
                this.loadPictures();
            }
            else {
                console.log("Sentinel is not visible.");
            }
        }, this.observerOptions);
        if (this.observer) {
            this.observer.observe(sentinel);
            console.log("Observer initialized and watching sentinel.");
        }
    }
    createElement(tag, className = "", textContent = "") {
        const element = document.createElement(tag);
        element.className = className;
        element.textContent = textContent;
        return element;
    }
    createButton(text, className, onClick, disabled = false) {
        const button = this.createElement("button", className, text);
        button.onclick = onClick;
        button.disabled = disabled;
        return button;
    }
}
