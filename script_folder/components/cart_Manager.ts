export class CartManager {
    private cart: { id: number; src: string; price: number; name: string; quantity: number }[] = [];
    private cartItemsContainer: HTMLElement;
    private subtotalElement: HTMLElement;
    private customerId: string;
    private sessionId: string;

    constructor(cartItemsContainerId: string, subtotalElementId: string) {
        this.cartItemsContainer = document.getElementById(cartItemsContainerId)!;
        this.subtotalElement = document.getElementById(subtotalElementId)!;

        this.customerId = this.getOrCreateId("customerId");
        this.sessionId = this.getOrCreateId("sessionId");

        this.loadCartFromStorage();
        this.renderCartItems();
        this.updateSubtotal();
        this.attachEventListeners();

        this.syncCartWithDatabase();
    }

    private getOrCreateId(key: string): string {
        let id = localStorage.getItem(key);
        if (!id) {
            id = `${key}-${crypto.randomUUID()}`;
            localStorage.setItem(key, id);
        }
        return id;
    }

    private loadCartFromStorage(): void {
        const savedCart = localStorage.getItem("cart");
        if (savedCart) {
            console.log("Cart loaded from localStorage:", savedCart);
            this.cart = JSON.parse(savedCart);
        } else {
            console.warn("No cart data found in localStorage");
        }
    }

    private saveCartToStorage(): void {
        localStorage.setItem("cart", JSON.stringify(this.cart));
    }

    private renderCartItems(): void {
        this.cartItemsContainer.innerHTML = "";

        if (this.cart.length === 0) {
            this.cartItemsContainer.innerHTML = "<tr><td colspan='4' class='text-center'>Your cart is empty.</td></tr>";
            return;
        }

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
    }

    private updateSubtotal(): void {
        const subtotal = this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        this.subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    }

    private attachEventListeners(): void {
        const incrementButtons = this.cartItemsContainer.querySelectorAll(".increment");
        const decrementButtons = this.cartItemsContainer.querySelectorAll(".decrement");

        incrementButtons.forEach(button => {
            button.addEventListener("click", () => {
                const itemId = parseInt((button as HTMLElement).dataset.id!);
                this.updateQuantity(itemId, 1);
            });
        });

        decrementButtons.forEach(button => {
            button.addEventListener("click", () => {
                const itemId = parseInt((button as HTMLElement).dataset.id!);
                this.updateQuantity(itemId, -1);
            });
        });
    }

    private updateQuantity(id: number, delta: number): void {
        const item = this.cart.find(item => item.id === id);
        if (item) {
            item.quantity = Math.max(1, (item.quantity || 1) + delta);
            this.saveCartToStorage();
            this.renderCartItems();
            this.updateSubtotal();
            this.syncCartWithDatabase();
        }
    }

    public async syncCartWithDatabase(): Promise<void> {
        try {
            // Prepare the cart data to sync with the backend
            const cartData = this.cart.map(item => ({
                product_id: item.id,
                name: item.name, // Optional, depends on your database needs
                price: item.price, // Optional, depends on your database schema
                quantity: item.quantity,
                timestamp: new Date().toISOString(), // Current timestamp
            }));
    
            // Validate cart data before sending
            if (!cartData || cartData.length === 0) {
                console.warn("No cart data to sync.");
                return;
            }
    
            const response = await fetch("http://localhost:3000/api/sync-cart", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    customerId: this.customerId,
                    sessionId: this.sessionId,
                    cart: cartData,
                }),
            });
    
            if (!response.ok) {
                const errorMessage = await response.text();
                console.error("Failed to sync cart:", errorMessage);
                throw new Error(`Sync failed with status: ${response.status}`);
            }
    
            console.log("Cart successfully synced with database.");
        } catch (error) {
            console.error("Error syncing cart:", error);
    
            // Retry logic: Can be adjusted based on requirements
            const maxRetries = 3;
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                console.log(`Retrying sync (${attempt}/${maxRetries})...`);
                try {
                    await this.syncCartWithDatabase();
                    console.log("Cart successfully synced after retry.");
                    break;
                } catch (retryError) {
                    console.error(`Retry ${attempt} failed:`, retryError);
                    if (attempt === maxRetries) {
                        console.error("All retry attempts failed.");
                    }
                }
            }
        }
    }
}
