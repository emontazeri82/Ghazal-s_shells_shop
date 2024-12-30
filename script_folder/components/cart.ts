export class EnhancedCart {
    private cart: { id: number; src: string; price?: number; name?: string; quantity: number }[] = [];
    private cartCountElement: HTMLElement;
    private cartModalElement: HTMLElement;
    private cartItemsElement: HTMLElement;
    private cartTotalElement: HTMLElement;

    constructor(cartIconId: string, cartModalId: string) {
        this.cartCountElement = document.querySelector(`#${cartIconId}`)!;
        this.cartModalElement = document.getElementById(cartModalId)!;
        this.cartItemsElement = this.cartModalElement.querySelector("#modal-cart-items")!;
        this.cartTotalElement = this.cartModalElement.querySelector("#cart-total")!;

        this.loadCartFromStorage();
        this.updateCartDisplay();
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        const clearCartButton = this.cartModalElement.querySelector("#clear-cart")!;
        clearCartButton.addEventListener("click", () => this.clearCart());
    }

    public addToCart(id: number, src: string, name?: string, price?: number): void {
        const existingItem = this.cart.find((item) => item.id === id);
        if (!existingItem) {
            this.cart.push({ id, src, price, name, quantity: 1 });
            this.saveCartToStorage();
            this.updateCartDisplay();
        } else {
            alert(`${name || "Item"} is already in the cart!`);
        }
    }

    public removeFromCart(id: number): void {
        this.cart = this.cart.filter((item) => item.id !== id);
        this.saveCartToStorage();
        this.updateCartDisplay();
    }

    public clearCart(): void {
        this.cart = [];
        this.saveCartToStorage();
        this.updateCartDisplay();
    }

    private saveCartToStorage(): void {
        localStorage.setItem("cart", JSON.stringify(this.cart));
    }

    private loadCartFromStorage(): void {
        const savedCart = localStorage.getItem("cart");
        if (savedCart) {
            this.cart = JSON.parse(savedCart);
        }
    }

    private updateCartDisplay(): void {
        this.cartItemsElement.innerHTML = "";

        const viewCartLink = this.cartModalElement.querySelector<HTMLAnchorElement>(".view-cart-link");

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

            listItem.querySelector(".remove-btn")!.addEventListener("click", () => this.removeFromCart(item.id));
            this.cartItemsElement.appendChild(listItem);
        });
    }
}
