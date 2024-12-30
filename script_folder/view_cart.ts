import { CartManager } from "./components/cart_Manager";
// import { CartManager } from "@components/cart_Manager";

console.log('CartManager:', CartManager);

document.addEventListener("DOMContentLoaded", () => {
    try {
        // Initialize CartManager
        const cartManager = new CartManager("view-cart-items", "subtotal");

        // Example: Attach additional event listeners for actions like checkout
        const checkoutButton = document.getElementById("checkout-button");
        if (checkoutButton) {
            checkoutButton.addEventListener("click", async () => {
                try {
                    await cartManager.syncCartWithDatabase();
                    alert("Cart synced successfully! Proceeding to checkout...");
                    window.location.href = "payment.html"; // Redirect to checkout page
                } catch (error) {
                    console.error("Error syncing cart:", error);
                    alert("Failed to sync cart. Please try again.");
                }
            });
        } else {
            console.warn("Checkout button not found.");
        }
    } catch (error) {
        console.error("Error initializing CartManager:", error);
    }
});
