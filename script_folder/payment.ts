declare const paypal: any;

document.addEventListener("DOMContentLoaded", function () {
    const pickupOption = document.getElementById("pickup-option") as HTMLInputElement | null;
    const deliveryOption = document.getElementById("delivery-option") as HTMLInputElement | null;
    const statusContainer = document.getElementById("payment-status") as HTMLElement | null;

    // Verify that PayPal Buttons API is available
    if (typeof paypal === "undefined") {
        console.error("PayPal SDK is not loaded. Ensure the PayPal script is included in your HTML file.");
        if (statusContainer) {
            statusContainer.innerHTML = "PayPal SDK not loaded. Please try again later.";
        }
        return;
    }

    function disableOrderTypeButtons(disable: boolean): void {
        if (pickupOption) pickupOption.disabled = disable;
        if (deliveryOption) deliveryOption.disabled = disable;
    }

    // Initialize PayPal Buttons
    paypal.Buttons({
        createOrder: function (data: Record<string, unknown>, actions: any) {
            if (!pickupOption || !deliveryOption) {
                if (statusContainer) {
                    statusContainer.innerHTML = "Order options not found. Please refresh the page.";
                }
                return Promise.reject(new Error("Order options not configured."));
            }

            const isPickup = pickupOption.checked;
            const totalAmount = getTotalAmount();

            if (isNaN(totalAmount) || totalAmount <= 0) {
                if (statusContainer) {
                    statusContainer.innerHTML = "Invalid cart total. Please check your cart.";
                }
                return Promise.reject(new Error("Invalid total amount."));
            }

            return actions.order.create({
                purchase_units: [
                    {
                        amount: {
                            value: totalAmount.toFixed(2),
                        },
                        description: isPickup ? "Pickup Order" : "Delivery Order",
                    },
                ],
                application_context: {
                    shipping_preference: isPickup ? "NO_SHIPPING" : "GET_FROM_FILE",
                },
            });
        },
        onClick: function () {
            disableOrderTypeButtons(true);
            observePayPalWindow();
        },
        onApprove: async function (data: Record<string, unknown>, actions: any) {
            try {
                const order = await actions.order.capture();
                console.log("Order Captured:", order);
        
                // Extract necessary data from the PayPal order
                const totalAmount = order.purchase_units[0].amount.value;
                const billingAddress = order.payer.address; // Adjust based on PayPal response
                const shippingAddress = order.purchase_units[0].shipping?.address; // Adjust based on PayPal response
        
                // Construct payload for backend
                const payload = {
                    customer_id: "CUSTOMER_ID_FROM_SESSION", // Replace with actual customer ID
                    session_id: "SESSION_ID_FROM_SESSION", // Replace with actual session ID
                    cart_id: "CART_ID_FROM_FRONTEND", // Replace with actual cart ID
                    total_price: totalAmount,
                    payment_status: "Paid",
                    shipping_address: shippingAddress ? JSON.stringify(shippingAddress) : null,
                    billing_address: billingAddress ? JSON.stringify(billingAddress) : null,
                    payment_method: "PayPal",
                };
        
                // Send payment data to backend
                const response = await fetch("/api/save-payment", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
        
                const result = await response.json();
        
                if (result.success) {
                    console.log("Payment data saved successfully.");
                    if (statusContainer) {
                        statusContainer.innerHTML = `Payment successful! Order ID: ${order.id}`;
                    }
                } else {
                    throw new Error(result.message || "Failed to save payment data.");
                }
            } catch (error) {
                handleError(error, "PayPal payment failed.");
            } finally {
                disableOrderTypeButtons(false);
            }
        },
        
        onCancel: function () {
            disableOrderTypeButtons(false);
        },
        onError: function (err: unknown) {
            handleError(err, "PayPal payment encountered an error.");
            disableOrderTypeButtons(false);
        },
    }).render("#paypal-container");

    function getTotalAmount(): number {
        const cartTotalElement = document.getElementById("cart-total") as HTMLElement | null;

        if (!cartTotalElement) {
            console.error("Cart total element not found.");
            return 0; // Fallback default value
        }

        const cartTotalText = cartTotalElement.innerText || "0";
        return parseFloat(cartTotalText.replace(/[^0-9.]/g, "")) || 0; // Ensure a numeric value
    }

    function handleError(error: unknown, fallbackMessage: string): void {
        console.error(fallbackMessage, error);
        if (statusContainer) {
            statusContainer.innerHTML =
                fallbackMessage + (error instanceof Error ? `: ${error.message}` : "");
        }
    }

    function observePayPalWindow() {
        const paypalWindow = document.querySelector("iframe[title='PayPal'], iframe.paypal-checkout") as HTMLElement | null;

        if (!paypalWindow) return;

        const observer = new MutationObserver(() => {
            if (!document.body.contains(paypalWindow)) {
                disableOrderTypeButtons(false); // Re-enable buttons when billing form closes
                observer.disconnect(); // Cleanup the observer
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }
});

