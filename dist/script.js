"use strict";
class EnhancedCart {
    constructor(cartIconId, cartModalId) {
        this.cart = [];
        this.cartCountElement = document.querySelector("#cart-count");
        this.cartModalElement = document.getElementById(cartModalId);
        this.cartItemsElement = this.cartModalElement.querySelector("#modal-cart-items");
        this.cartTotalElement = this.cartModalElement.querySelector("#cart-total");
        // load cart from localStorage
        this.loadCartFromStorage();
        this.updateCartDisplay();
        // setup event listeners
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
        const viewCartLink = document.querySelector(".view-cart-link");
        if (this.cart.length === 0) {
            this.cartItemsElement.innerHTML = "<li class='list-group-item'>Your cart is empty.</li>";
            this.cartCountElement.textContent = "0";
            this.cartTotalElement.textContent = "0.00";
            if (viewCartLink)
                viewCartLink.style.display = "none";
            return;
        }
        // Show the 'View Cart' link when cart has items
        if (viewCartLink)
            viewCartLink.style.display = "inline-block";
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = this.cart.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
        this.cartCountElement.textContent = totalItems.toString();
        this.cartTotalElement.textContent = totalPrice.toFixed(2);
        const cartList = document.createElement("ul");
        cartList.className = "cart-List list-unstyled";
        this.cart.forEach((item) => {
            const listItem = document.createElement("li");
            listItem.className = "modal-cart-item d-felx align-items-center justify-content-between mb-2";
            listItem.innerHTML = `
                <div class="d-flex align-items-center">
                    <img src="${item.src}" alt="${item.name || "unnamed"}" class="img-thumbnail me-3" style="width: 50px;" />
                    <div>
                        <p class="mb-0"><strong>${item.name || "Unnamed"}</strong></p>
                        <p class="mb-0">${item.price !== undefined ? `Price: $${item.price.toFixed(2)}` : ""}</p>
                    </div>
                </div>
                <buttom class="btn btn-danger btn-sm remove-btn">Remove</button>
            `;
            listItem.querySelector(".remove-btn").addEventListener("click", () => this.removeFromCart(item.id));
            this.cartItemsElement.appendChild(listItem);
        });
    }
}
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
                const picture = this.pictures[this.loadedPictures];
                const col = this.createColumn(this.loadedPictures + 1, picture);
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
    createColumn(id, picture) {
        const col = document.createElement("div");
        col.className = `${this.gridClasses}`;
        const img = this.createImage(picture.src, picture.name || `Picture ${id}`);
        const idLabel = document.createElement("p");
        idLabel.textContent = `ID: ${id}`;
        idLabel.className = "text-center mt-2";
        const addToCartButton = document.createElement("button");
        addToCartButton.textContent = "Add to Cart";
        addToCartButton.className = "btn btn-primary btn-sm add-to-cart-button";
        addToCartButton.addEventListener("click", () => this.cart.addToCart(id, picture.src, picture.name, picture.price));
        col.appendChild(img);
        col.appendChild(idLabel);
        col.appendChild(addToCartButton);
        return col;
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
    setupObserver() {
        const sentinel = document.createElement("div");
        sentinel.className = "sentinel";
        this.gallery.appendChild(sentinel);
        this.observer = new IntersectionObserver((entries) => {
            const lastEntry = entries[0];
            if (lastEntry.isIntersecting) {
                this.loadPictures();
                // Reuse sentinel if more images are available
                if (this.loadedPictures >= this.pictures.length && this.observer) {
                    this.observer.disconnect(); // Stop observing when all images are loaded
                }
            }
        }, this.observerOptions);
        if (this.observer) {
            this.observer.observe(sentinel);
        }
        if (this.loadedPictures >= this.pictures.length) {
            sentinel.remove();
        }
    }
    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, { detail });
        this.gallery.dispatchEvent(event);
    }
}
class CartManager {
    constructor(cartItemsContainerId, subtotalElementId) {
        this.cart = [];
        // Ensure required elements are present
        this.cartItemsContainer = document.getElementById(cartItemsContainerId);
        this.subtotalElement = document.getElementById(subtotalElementId);
        this.loadCartFromStorage(); // Load cart from localStorage
        this.renderCartItems(); // Render items in the cart
        this.updateSubtotal(); // Calculate and display subtotal
        this.attachEventListeners(); // Attach button event listeners
    }
    loadCartFromStorage() {
        const savedCart = localStorage.getItem("cart");
        if (savedCart) {
            console.log("Cart loaded from localStorage:", savedCart); // Debug
            this.cart = JSON.parse(savedCart);
        }
        else {
            console.warn("No cart data found in localStorage"); // Debug
        }
    }
    saveCartToStorage() {
        localStorage.setItem("cart", JSON.stringify(this.cart));
    }
    renderCartItems() {
        this.cartItemsContainer.innerHTML = ""; // Clear existing items
        if (this.cart.length === 0) {
            this.cartItemsContainer.innerHTML = "<tr><td colspan='4' class='text-center'>Your cart is empty.</td></tr>";
            return;
        }
        // Render each cart item
        this.cart.forEach(item => {
            const price = item.price || 0;
            const quantity = item.quantity || 1;
            const total = price * quantity;
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${item.src}" alt="${item.name}" class="img-thumbnail" style="width: 60px; height: 60px; object-fit: cover;">
                        <span class="ms-3">${item.name}</span>
                    </div>
                </td>
                <td>$${item.price.toFixed(2)}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <button class="btn btn-outline-secondary btn-sm decrement" data-id="${item.id}">-</button>
                        <input type="text" class="form-control form-control-sm text-center mx-1" value="${item.quantity}" style="width: 50px;" readonly>
                        <button class="btn btn-outline-secondary btn-sm increment" data-id="${item.id}">+</button>
                    </div>
                </td>
                <td>$${total.toFixed(2)}</td>
            `;
            this.cartItemsContainer.appendChild(row);
        });
        // Attach button event listeners
        this.updateSubtotal();
        this.attachEventListeners();
    }
    updateSubtotal() {
        const subtotal = this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        this.subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    }
    attachEventListeners() {
        // Add increment button listeners
        const incrementButtons = this.cartItemsContainer.querySelectorAll(".increment");
        const decrementButtons = this.cartItemsContainer.querySelectorAll(".decrement");
        incrementButtons.forEach(button => {
            button.addEventListener("click", () => {
                const itemId = parseInt(button.dataset.id);
                this.updateQuantity(itemId, 1);
            });
        });
        // Add decrement button listeners
        decrementButtons.forEach(button => {
            button.addEventListener("click", () => {
                const itemId = parseInt(button.dataset.id);
                this.updateQuantity(itemId, -1);
            });
        });
    }
    updateQuantity(id, delta) {
        const item = this.cart.find(item => item.id === id);
        if (item) {
            item.quantity = Math.max(1, (item.quantity || 1) + delta);
            this.saveCartToStorage();
            this.renderCartItems(); // Re-render items
            this.updateSubtotal(); // Update subtotal
        }
    }
}
// Initialize the shopping cart on DOM content load
document.addEventListener("DOMContentLoaded", async () => {
    try {
        if (!localStorage.getItem("cart")) {
            localStorage.setItem("cart", JSON.stringify([]));
        }
        // Fetch products from the backend API
        const response = await fetch("http://localhost:3000/api/products");
        if (!response.ok)
            throw new Error("Failed to fetch products");
        const products = await response.json();
        const pictures = products.map((product) => ({
            src: product.image_url,
            name: product.name,
            price: product.price,
        }));
        // Pass `pictures` into your gallery initialization logic
        const galleryConfig = {
            batchSize: 10,
            gridClasses: "col-12 col-sm-6 col-md-4 col-lg-3",
            fallbackImage: "/fallback.jpg",
        };
        const cart = new EnhancedCart("cart-icon", "cartModal");
        new InfiniteScrollGallery("gallery", cart, pictures, galleryConfig);
    }
    catch (error) {
        console.error("Error fetching products:", error);
    }
    // Initialize CartManager
    try {
        new CartManager("view-cart-items", "subtotal");
    }
    catch (error) {
        console.error("Error initializing CartManager:", error);
    }
    // Set up checkout button
    const checkoutButton = document.getElementById("checkout-button");
    if (checkoutButton) {
        checkoutButton.addEventListener("click", () => {
            const cartData = localStorage.getItem("cart") || "[]";
            localStorage.setItem("cart", cartData);
            window.location.href = "../htmls_folder/payment.html";
        });
    }
    else {
        console.warn("Checkout button not found.");
    }
});
