declare const paypal: any;

document.addEventListener("DOMContentLoaded", async function () {
    /* Square Payments Initialization
    const payments = Square.payments(appId, locationId);

    // Initialize Card Payment
    const card = await payments.card();
    await card.attach("#card-container");

    document.getElementById("card-button")?.addEventListener("click", async function () {
        const statusContainer = document.getElementById("payment-status");
        const totalAmount = getTotalAmount(); // Fetch total from the cart

        if (getOrderOption() === "delivery" && !validateDeliveryFields()) {
            return;
        }
        if (statusContainer) statusContainer.innerHTML = "Processing card payment...";

        try {
            const tokenResult = await card.tokenize();
            if (tokenResult.status === "OK") {
                console.log("Card Token:", tokenResult.token); // Send this token to your server
                if (statusContainer) {
                    statusContainer.innerHTML = `Payment of $${totalAmount} successful!`;
                }                
            } else {
                throw new Error("Card tokenization failed");
            }
        } catch (error) {
            if (statusContainer) {
                handleError(statusContainer, error, "Card payment failed.");
            } else {
                console.error("Card payment failed and status container is not available.", error);
            } 
        }
    }); */

    // PayPal Buttons Initialization
    paypal.Buttons({
        createOrder: function (data: Record<string, unknown>, actions: any) {
            // const totalAmount = getTotalAmount();
            // console.log("Total Amount for PayPal:", getTotalAmount);
            if (getOrderOption() === "delivery" && !validateDeliveryFields()) {
                throw new Error("Delivery details are incomplete.");
            }
            // Proceed with order creation
            const orderDetails: any = {
                purchase_units: [
                    {
                        amount: {
                            value: getTotalAmount().toFixed(2),
                        },
                        description: getOrderOption() === "pickup" ? "Pickup Order" : "Delivery Order",
                    },
                ],
            };
            if (getOrderOption() === "delivery") {
                orderDetails.purchase_units[0].shipping = {
                    name: {
                        full_name: getRecipientName(),
                    },
                    address: {
                        address_line_1: (document.getElementById("address") as HTMLInputElement)?.value || "",
                        admin_area_2: (document.getElementById("city") as HTMLInputElement)?.value || "",
                        admin_area_1: (document.getElementById("state") as HTMLSelectElement)?.value || "",
                        postal_code: (document.getElementById("zip") as HTMLInputElement)?.value || "",
                        country_code: "US",
                    },
                };        
            }
            
            return actions.order.create(orderDetails);
        },
        onApprove: async function (data: Record<string, unknown>, actions: any) {
            const statusContainer = document.getElementById("payment-status");
            if (statusContainer) {
                try {
                    const order = await actions.order.capture();
                    console.log("Order Captured:", order);
                    statusContainer.innerHTML = `PayPal payment successful! Order ID: ${order.id}`;
                } catch (error) {
                    handleError(statusContainer, error, "PayPal payment failed.");
                }
            } else {
                console.error("Payment status container not found.");
            }
        },
        onError: function (err: unknown) {
            const statusContainer = document.getElementById("payment-status");
            if (statusContainer) {
                statusContainer.innerHTML = "PayPal payment encountered an error.";
            }
            console.error("PayPal Error:", err);
        },
    }).render("#paypal-container");
    // Function to Create Square Order
    /* async function createSquareOrder(token: string, totalAmount: number) {
        const deliveryDetails = {
            recipient: getRecipientName(),
            address: (document.getElementById("address") as HTMLInputElement)?.value || "",
            city: (document.getElementById("city") as HTMLInputElement)?.value || "",
            state: (document.getElementById("state") as HTMLSelectElement)?.value || "",  
            zip: (document.getElementById("zip") as HTMLInputElement)?.value || "",   
        };

        if (!deliveryDetails.address || !deliveryDetails.city || !deliveryDetails.state || !deliveryDetails.zip) {
            alert("Delivery details are incomplete. Please fill out all fields.");
            console.error("Incomplete delivery details.");
            return;
        }
        const payload = {
            source_id: token,
            amount_money: {
                amount: totalAmount * 100, // Convert to cents
                currency: "USD",
            },
            location_id: locationId,
            buyer_email_address: "customer@example.com",
            delivery_details: deliveryDetails,
        };

        // Simulate API call
        console.log("Sending to server:", payload);
        if (deliveryDetails.address && deliveryDetails.city && deliveryDetails.state && deliveryDetails.zip) {
            alert(`Square order created with delivery info: ${JSON.stringify(deliveryDetails)}`);
        } else {
            alert("Delivery details are incomplete. Please fill out all fields.");
        }
        
    } */

    // Function to Save Delivery Information
    function saveDeliveryInfo(orderId: string) {
        // validate shipping fields
        if (getOrderOption() === "delivery" && !validateDeliveryFields()){
            return; 
        }
        const deliveryData = {
            orderId: orderId,
            recipient: getRecipientName(),
            address: (document.getElementById("address") as HTMLInputElement)?.value || "",
            city: (document.getElementById("city") as HTMLInputElement)?.value || "",
            state: (document.getElementById("state") as HTMLSelectElement)?.value || "",
            zip: (document.getElementById("zip") as HTMLInputElement)?.value || "",
        };
        console.log("Delivery Details Saved:", deliveryData);
        alert("Delivery details saved successfully!");
    }

    // Function to Get Recipient Name
    function getRecipientName(): string {
        const firstName = (document.getElementById("first-name") as HTMLInputElement)?.value || "Unknown";
        const lastName = (document.getElementById("last-name")as HTMLInputElement)?.value || "User";
        return `${firstName} ${lastName}`;
    }
    function getOrderOption(): string {
        const pickupOption = (document.getElementById("pickup-option") as HTMLInputElement)?.checked;
        const deliveryOption = (document.getElementById("delivery-option") as HTMLInputElement)?.checked;

        if (pickupOption) return "pickup";
        if (deliveryOption) return "delivery";
        return "";
    }
    // validate delivery fields
    function validateDeliveryFields(): boolean {
        if (getOrderOption() === "pickup") {
            return true;
        }

        const address = (document.getElementById("address") as HTMLInputElement)?.value || "";
        const city = (document.getElementById("city") as HTMLInputElement)?.value || "";
        const state = (document.getElementById("state") as HTMLSelectElement)?.value || "";
        const zip = (document.getElementById("zip") as HTMLInputElement)?.value || "";
    
        if (!address || !city || !state || !zip) {
            alert("Delivery details are incomplete. Please fill out all fields.");
            console.error("Incomplete delivery details.");
            return false;
        }
    
        return true;
    }
    

    // Function to Get Total Amount from "View Cart"
    function getTotalAmount(): number {
        // Helper function to safely parse a value
        function parseValue(elementId: string): number {
            const element = document.getElementById(elementId);
            if (element && element.innerText) {
                const cleanValue = element.innerText.replace(/[^0-9.]/g, ""); // Remove all non-numeric characters except "."
                return parseFloat(cleanValue) || 0; // Default to 0 if invalid
            }
            return 0; // Default to 0 if element not found
        }
    
        // Parse the values
        const subtotal = parseValue("subtotal");
        const taxes = parseValue("taxes");
        const shipping = parseValue("shipping");
    
        // Calculate the total
        const totalAmount = subtotal + taxes + shipping;
    
        console.log("Subtotal:", subtotal, "Taxes:", taxes, "Shipping:", shipping, "Total:", totalAmount);
    
        return Number(totalAmount.toFixed(2)); // Ensure 2 decimal places and cast to number
    }
    

    // General Error Handler
    function handleError(
        statusContainer: HTMLElement,
        error: unknown,
        fallbackMessage: string
    ): void {
        if (error instanceof Error) {
            statusContainer.innerHTML = `${fallbackMessage} ${error.message}`;
        } else {
            statusContainer.innerHTML = `${fallbackMessage} An unknown error occurred.`;
        }
    }
});


