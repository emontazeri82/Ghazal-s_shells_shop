/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./script_folder/components/cart.ts":
/*!******************************************!*\
  !*** ./script_folder/components/cart.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   EnhancedCart: () => (/* binding */ EnhancedCart)
/* harmony export */ });
class EnhancedCart {
    constructor(cartIconId, cartModalId) {
        this.cart = [];
        this.cartCountElement = document.querySelector(`#${cartIconId}`);
        this.cartModalElement = document.getElementById(cartModalId);
        this.cartItemsElement = this.cartModalElement.querySelector("#modal-cart-items");
        this.cartTotalElement = this.cartModalElement.querySelector("#cart-total");
        this.loadCartFromStorage();
        this.updateCartDisplay();
        this.setupEventListeners();
    }
    setupEventListeners() {
        const clearCartButton = this.cartModalElement.querySelector("#clear-cart");
        clearCartButton.addEventListener("click", () => this.clearCart());
    }
    addToCart(id, src, name, price) {
        const existingItem = this.cart.find((item) => item.id === id);
        if (!existingItem) {
            this.cart.push({ id, src, price, name, quantity: 1 });
            this.saveCartToStorage();
            this.updateCartDisplay();
        }
        else {
            alert(`${name || "Item"} is already in the cart!`);
        }
    }
    removeFromCart(id) {
        this.cart = this.cart.filter((item) => item.id !== id);
        this.saveCartToStorage();
        this.updateCartDisplay();
    }
    clearCart() {
        this.cart = [];
        this.saveCartToStorage();
        this.updateCartDisplay();
    }
    saveCartToStorage() {
        localStorage.setItem("cart", JSON.stringify(this.cart));
    }
    loadCartFromStorage() {
        const savedCart = localStorage.getItem("cart");
        if (savedCart) {
            this.cart = JSON.parse(savedCart);
        }
    }
    updateCartDisplay() {
        this.cartItemsElement.innerHTML = "";
        const viewCartLink = this.cartModalElement.querySelector(".view-cart-link");
        if (!viewCartLink) {
            console.error("View Cart link not found.");
            return;
        }
        if (this.cart.length === 0) {
            this.cartItemsElement.innerHTML = "<li class='list-group-item'>Your cart is empty.</li>";
            this.cartCountElement.textContent = "0";
            this.cartTotalElement.textContent = "0.00";
            viewCartLink.style.display = "none";
            return;
        }
        viewCartLink.style.display = "inline"; // Show link
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = this.cart.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
        this.cartCountElement.textContent = totalItems.toString();
        this.cartTotalElement.textContent = totalPrice.toFixed(2);
        this.cart.forEach((item) => {
            const listItem = document.createElement("li");
            listItem.className = "list-group-item d-flex justify-content-between align-items-center";
            listItem.innerHTML = `
            <div class="d-flex align-items-center">
                <img src="${item.src}" alt="${item.name || "Product"}" class="img-thumbnail me-3" style="width: 50px; height: 50px;">
                <span>${item.name || "Unnamed Product"}</span>
            </div>
            <button class="btn btn-danger btn-sm remove-btn">Remove</button>
        `;
            listItem.querySelector(".remove-btn").addEventListener("click", () => this.removeFromCart(item.id));
            this.cartItemsElement.appendChild(listItem);
        });
    }
}


/***/ }),

/***/ "./script_folder/components/gallery.ts":
/*!*********************************************!*\
  !*** ./script_folder/components/gallery.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   InfiniteScrollGallery: () => (/* binding */ InfiniteScrollGallery)
/* harmony export */ });
class InfiniteScrollGallery {
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


/***/ }),

/***/ "./script_folder/pathResolver.ts":
/*!***************************************!*\
  !*** ./script_folder/pathResolver.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PathResolver: () => (/* binding */ PathResolver)
/* harmony export */ });
class PathResolver {
    constructor(basePath) {
        this.basePath = basePath || window.location.origin;
        if (!this.basePath.endsWith("/")) {
            this.basePath += "/";
        }
    }
    getFullPath(relativePath) {
        if (relativePath.startsWith("/")) {
            relativePath = relativePath.slice(1); // Remove leading slash
        }
        return `${this.basePath}${relativePath}`;
    }
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!********************************!*\
  !*** ./script_folder/index.ts ***!
  \********************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _pathResolver__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./pathResolver */ "./script_folder/pathResolver.ts");
/* harmony import */ var _components_cart__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @components/cart */ "./script_folder/components/cart.ts");
/* harmony import */ var _components_gallery__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @components/gallery */ "./script_folder/components/gallery.ts");



document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Initialize PathResolver dynamically
        const pathResolver = new _pathResolver__WEBPACK_IMPORTED_MODULE_0__.PathResolver();
        // Fetch all products from the API
        const productsEndpoint = pathResolver.getFullPath("api/products");
        console.log(`Fetching products from: ${productsEndpoint}`);
        const response = await fetch(productsEndpoint);
        if (!response.ok) {
            const errorText = await response.text(); // Read the error message
            console.error("Failed to fetch products. Server responded with:", errorText);
            throw new Error(`Failed to fetch products. Status: ${response.status}`);
        }
        let products;
        try {
            products = await response.json(); // Parse JSON
        }
        catch (error) {
            console.error("Error parsing JSON:", error);
            throw new Error(`Invalid JSON response from ${productsEndpoint}`);
        }
        // Map products to pictures for the gallery
        const pictures = products.map((product) => ({
            id: product.id,
            src: product.image_url.startsWith("/")
                ? pathResolver.getFullPath(product.image_url.slice(1))
                : pathResolver.getFullPath(product.image_url),
            name: product.name,
            price: product.price,
            stock: product.stock,
        }));
        // Configure the gallery
        const galleryConfig = {
            batchSize: 10,
            gridClasses: "col-12 col-sm-6 col-md-4 col-lg-3",
            fallbackImage: pathResolver.getFullPath("/fallback.jpg"),
        };
        // Initialize cart and gallery
        const cart = new _components_cart__WEBPACK_IMPORTED_MODULE_1__.EnhancedCart("cart-icon", "cartModal");
        new _components_gallery__WEBPACK_IMPORTED_MODULE_2__.InfiniteScrollGallery("gallery", cart, pictures, galleryConfig);
    }
    catch (error) {
        console.error("Error loading gallery:", error);
    }
});

})();

/******/ })()
;
//# sourceMappingURL=bundle.js.map