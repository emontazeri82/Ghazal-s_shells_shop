interface GalleryConfig {
    gridClasses?: string;
    observerOptions?: IntersectionObserverInit;
    batchSize?: number;
    fallbackImage?: string;
}

class EnhancedCart {
    private cart: { id: number; src: string; price?: number; name?: string; quantity: number }[] = [];
    private cartCountElement: HTMLElement;
    private cartModalElement: HTMLElement;
    private cartItemsElement: HTMLElement;
    private cartTotalElement: HTMLElement;

    constructor(cartIconId: string, cartModalId: string) {
        this.cartCountElement = document.querySelector("#cart-count")!;
        this.cartModalElement = document.getElementById(cartModalId)!;
        this.cartItemsElement = this.cartModalElement.querySelector("#modal-cart-items")!;
        this.cartTotalElement = this.cartModalElement.querySelector("#cart-total")!;

        // load cart from localStorage
        this.loadCartFromStorage();
        this.updateCartDisplay();
        // setup event listeners
        this.setupEventListeners();
    }
    private setupEventListeners(): void {
        const clearCartButton = this.cartModalElement.querySelector("#clear-cart")!;
        clearCartButton.addEventListener("click", () => this.clearCart());

    }

    public addToCart(id: number, src: string, name?: string, price?: number): void {
        const existingItem = this.cart.find((item) => item.id === id);
        if(!existingItem) {
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

        const viewCartLink = document.querySelector(".view-cart-link") as HTMLElement;

        if (this.cart.length === 0) {
            this.cartItemsElement.innerHTML = "<li class='list-group-item'>Your cart is empty.</li>";
            this.cartCountElement.textContent = "0";
            this.cartTotalElement.textContent = "0.00";

            if (viewCartLink) viewCartLink.style.display = "none";
            return;
        }
        // Show the 'View Cart' link when cart has items
        if (viewCartLink) viewCartLink.style.display = "inline-block";

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

            listItem.querySelector(".remove-btn")!.addEventListener("click", () => this.removeFromCart(item.id));

            this.cartItemsElement.appendChild(listItem);
        });
        
    }
}
class InfiniteScrollGallery {
    private gallery: HTMLElement;
    private pictures: { src: string; name?: string; price?: number }[];
    private loadedPictures: number;
    private observer!: IntersectionObserver | null;
    private batchSize: number;
    private gridClasses: string;
    private observerOptions: IntersectionObserverInit;
    private fallbackImage?: string;
    private isLoading: boolean = false;
    private cart: EnhancedCart;

    constructor(galleryId: string, cart: EnhancedCart, pictures: { src: string; name?: string; price?: number }[], config: GalleryConfig = {}) {
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

    private initialize(): void {
        this.loadPictures(); // Initial batch load
        this.setupObserver(); // Setup infinite scrolling
    }

    private loadPictures(count: number = this.batchSize): void {
        if (this.isLoading) return;

        this.isLoading = true;

        // Simulate delay for better user experience
        setTimeout(() => {
            for (let i = 0; i < count; i++) {
                if (this.loadedPictures >= this.pictures.length) break;

                const picture = this.pictures[this.loadedPictures];
                const col = this.createColumn(this.loadedPictures + 1, picture);

                this.gallery.appendChild(col);
                this.loadedPictures++;
            }

            this.isLoading = false;

            // Dispatch events
            if (this.loadedPictures === this.pictures.length) {
                this.dispatchEvent("allImagesLoaded");
            } else {
                this.dispatchEvent("imageLoaded", { loadedPictures: this.loadedPictures });
            }
        }, 500); // Simulate delay
    }
    private createColumn(id: number, picture: { src: string; name?: string; price?: number }): HTMLDivElement {
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
    private createImage(src: string, alt: string): HTMLImageElement {
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

    private setupObserver(): void {
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

    private dispatchEvent<T>(eventName: string, detail: T = {} as T): void {
        const event = new CustomEvent<T>(eventName, { detail });
        this.gallery.dispatchEvent(event);
    }
}  

class CartManager {
    private cart: { id: number; src: string; price: number; name: string; quantity: number }[] = [];
    private cartItemsContainer: HTMLElement;
    private subtotalElement: HTMLElement;

    constructor(cartItemsContainerId: string, subtotalElementId: string) {
        // Ensure required elements are present
        this.cartItemsContainer = document.getElementById(cartItemsContainerId)!;
        this.subtotalElement = document.getElementById(subtotalElementId)!;

        this.loadCartFromStorage(); // Load cart from localStorage
        this.renderCartItems(); // Render items in the cart
        this.updateSubtotal(); // Calculate and display subtotal
        this.attachEventListeners(); // Attach button event listeners
    }

    private loadCartFromStorage(): void {
        const savedCart = localStorage.getItem("cart");
        if (savedCart) {
            console.log("Cart loaded from localStorage:", savedCart); // Debug
            this.cart = JSON.parse(savedCart);
        } else {
            console.warn("No cart data found in localStorage"); // Debug
        }
    }

    private saveCartToStorage(): void {
        localStorage.setItem("cart", JSON.stringify(this.cart));
    }

    private renderCartItems(): void {
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

    private updateSubtotal(): void {
        const subtotal = this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        this.subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    }

    private attachEventListeners(): void {
        // Add increment button listeners
        const incrementButtons = this.cartItemsContainer.querySelectorAll(".increment");
        const decrementButtons = this.cartItemsContainer.querySelectorAll(".decrement");

        incrementButtons.forEach(button => {
            button.addEventListener("click", () => {
                const itemId = parseInt((button as HTMLElement).dataset.id!);
                this.updateQuantity(itemId, 1);
            });
        });

        // Add decrement button listeners
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
            this.renderCartItems(); // Re-render items
            this.updateSubtotal(); // Update subtotal
        }
    }
}

// Initialize the shopping cart on DOM content load

document.addEventListener("DOMContentLoaded", () => {
    const pictures = Array.from(
        { length: 20 },
        (_, i) => ({
            src: `../images/image${i + 1}.jpg`,
            name: `Item ${i + 1}`,
            price: Math.round(Math.random() * 100) + 10,
        })
    );
    const galleryConfig: GalleryConfig = {
        batchSize: 10,
        gridClasses: "col-12 col-sm-6 col-md-4 col-lg-3",
        observerOptions: { root: null, threshold: 0.1 },
        fallbackImage: "../images/fallback.jpg",
    };

    
    const cart = new EnhancedCart("cart-icon", "cartModal");
    new InfiniteScrollGallery("gallery", cart, pictures, galleryConfig);
    
});
document.addEventListener("DOMContentLoaded", () => {
    new CartManager("view-cart-items", "subtotal");
});

// Target the checkout button
const checkoutButton = document.getElementById("checkout-button") as HTMLButtonElement;

// Add click event listener to the button
checkoutButton.addEventListener("click", () => {
    // Save cart data to localStorage (if needed)
    const cartData = localStorage.getItem("cart") || "[]";
    localStorage.setItem("cart", cartData);

    // Redirect to payment.html
    window.location.href = "../htmls_folder/payment.html";
});

