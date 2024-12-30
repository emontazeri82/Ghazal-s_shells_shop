export class EnhancedCart {
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
