export function addToCartEvent(){
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "add_to_cart" });
    console.log("AddToCart")
}