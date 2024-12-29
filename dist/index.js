import { PathResolver } from "./pathResolver";
import { EnhancedCart } from "@components/cart";
import { InfiniteScrollGallery } from "@components/gallery";
document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Initialize PathResolver dynamically
        const pathResolver = new PathResolver();
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
        const cart = new EnhancedCart("cart-icon", "cartModal");
        new InfiniteScrollGallery("gallery", cart, pictures, galleryConfig);
    }
    catch (error) {
        console.error("Error loading gallery:", error);
    }
});
