// Product data is kept in products.js so it is easy to update the catalogue.
// This file handles the search, filters, wishlist and shopping bag.

const formatPrice = (amount) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(amount);
};

// Product prices are stored as text (for example, "₹49,990").
// Convert them to numbers whenever we need to sort or calculate a total.
function getPriceNumber(price) {
    return Number(String(price).replace(/[^0-9]/g, "")) || 0;
}

const store = {
    category: "All",
    searchText: "",
    sortBy: "featured",
    cart: [],
    wishlist: new Set()
};

const getElement = (selector) => document.querySelector(selector);
const productGrid = getElement("#productGrid");
const resultCount = getElement("#resultCount");
const toast = getElement("#toast");

// Show products that match the selected category and search text.
function showProducts() {
    let productsToShow = PRODUCTS.filter((product) => {
        const matchesCategory = store.category === "All" || product.category === store.category;
        const matchesSearch = product.name.toLowerCase().includes(store.searchText.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (store.sortBy === "low") {
        productsToShow.sort((a, b) => getPriceNumber(a.price) - getPriceNumber(b.price));
    } else if (store.sortBy === "high") {
        productsToShow.sort((a, b) => getPriceNumber(b.price) - getPriceNumber(a.price));
    } else if (store.sortBy === "az") {
        productsToShow.sort((a, b) => a.name.localeCompare(b.name));
    }

    resultCount.textContent = `${productsToShow.length} ${productsToShow.length === 1 ? "guitar" : "guitars"}`;
    getElement("#emptyState").hidden = productsToShow.length > 0;
    productGrid.hidden = productsToShow.length === 0;

    productGrid.innerHTML = productsToShow.map((product) => {
        const isSaved = store.wishlist.has(product.id);
        return `
            <article class="product-card">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                    <button class="wishlist ${isSaved ? "active" : ""}"
                        data-wish="${product.id}"
                        aria-label="Add ${product.name} to wishlist">
                        ${isSaved ? "♥" : "♡"}
                    </button>
                </div>
                <div class="product-info">
                    <span class="product-category">${product.category}</span>
                    <h3>${product.name}</h3>
                    <div class="rating" aria-label="Rated 4 out of 5">
                        ★★★★<span style="color: #d8d5cd">★</span>
                    </div>
                    <div class="product-bottom">
                        <span class="price">${product.price}</span>
                        <button class="add-button" data-add="${product.id}">＋ Add to bag</button>
                    </div>
                </div>
            </article>`;
    }).join("");
}

function chooseCategory(category) {
    store.category = category;

    document.querySelectorAll(".filter").forEach((button) => {
        button.classList.toggle("active", button.dataset.filter === category);
    });

    showProducts();
}

// A small message appears after actions such as adding an item to the bag.
function showMessage(message) {
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showMessage.timer);
    showMessage.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2200);
}

function addToBag(productId) {
    const existingItem = store.cart.find((item) => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        store.cart.push({ id: productId, quantity: 1 });
    }

    updateCart();
    showMessage("Added to your bag");
}

// Update the cart drawer, item count and subtotal after every cart change.
function updateCart() {
    const totalItems = store.cart.reduce((total, item) => total + item.quantity, 0);
    getElement("#cartCount").textContent = totalItems;
    getElement("#drawerCount").textContent = `(${totalItems})`;

    getElement("#cartEmpty").hidden = store.cart.length > 0;
    getElement("#cartFooter").hidden = store.cart.length === 0;

    getElement("#cartItems").innerHTML = store.cart.map((item) => {
        const product = PRODUCTS.find((entry) => entry.id === item.id);
        return `
            <div class="cart-row">
                <img src="${product.image}" alt="${product.name}">
                <div>
                    <h4>${product.name}</h4>
                    <small>${product.price}</small>
                    <div class="qty-controls">
                        <button data-qty="${product.id}" data-change="-1" aria-label="Decrease quantity">−</button>
                        <span>${item.quantity}</span>
                        <button data-qty="${product.id}" data-change="1" aria-label="Increase quantity">+</button>
                    </div>
                </div>
                <button class="remove-item" data-remove="${product.id}" aria-label="Remove ${product.name}">×</button>
            </div>`;
    }).join("");

    const subtotal = store.cart.reduce((total, item) => {
        const product = PRODUCTS.find((entry) => entry.id === item.id);
        return total + getPriceNumber(product.price) * item.quantity;
    }, 0);

    getElement("#subtotal").textContent = formatPrice(subtotal);
}

function openCart() {
    getElement("#cartDrawer").classList.add("open");
    getElement("#overlay").classList.add("open");
    getElement("#cartDrawer").setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
}

function closeCart() {
    getElement("#cartDrawer").classList.remove("open");
    getElement("#overlay").classList.remove("open");
    getElement("#cartDrawer").setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
}

// Use one click listener for product cards, including cards created later by search.
productGrid.addEventListener("click", (event) => {
    const addButton = event.target.closest("[data-add]");
    const wishlistButton = event.target.closest("[data-wish]");

    if (addButton) {
        addToBag(addButton.dataset.add);
    }

    if (wishlistButton) {
        const productId = wishlistButton.dataset.wish;

        if (store.wishlist.has(productId)) {
            store.wishlist.delete(productId);
            showMessage("Removed from wishlist");
        } else {
            store.wishlist.add(productId);
            showMessage("Saved to wishlist");
        }

        showProducts();
    }
});

// Category buttons above the catalogue.
getElement("#filters").addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (button) chooseCategory(button.dataset.filter);
});

// The large category tiles also take the visitor to the matching products.
document.querySelectorAll(".category-card").forEach((card) => {
    card.addEventListener("click", () => {
        chooseCategory(card.dataset.category);
        getElement("#shop").scrollIntoView({ behavior: "smooth" });
    });
});

getElement("#searchInput").addEventListener("input", (event) => {
    store.searchText = event.target.value;
    showProducts();
});

getElement("#sortSelect").addEventListener("change", (event) => {
    store.sortBy = event.target.value;
    showProducts();
});

function clearSearchAndFilters() {
    store.searchText = "";
    store.sortBy = "featured";
    getElement("#searchInput").value = "";
    getElement("#sortSelect").value = "featured";
    chooseCategory("All");
}

getElement("#clearFilters").addEventListener("click", clearSearchAndFilters);
getElement("#resetSearch").addEventListener("click", clearSearchAndFilters);

getElement("#searchFocus").addEventListener("click", () => {
    getElement("#shop").scrollIntoView({ behavior: "smooth" });
    setTimeout(() => getElement("#searchInput").focus(), 450);
});

// Shopping bag controls.
getElement("#openCart").addEventListener("click", openCart);
getElement("#closeCart").addEventListener("click", closeCart);
getElement("#overlay").addEventListener("click", closeCart);

getElement("#continueShopping").addEventListener("click", () => {
    closeCart();
    getElement("#shop").scrollIntoView({ behavior: "smooth" });
});

getElement("#cartItems").addEventListener("click", (event) => {
    const quantityButton = event.target.closest("[data-qty]");
    const removeButton = event.target.closest("[data-remove]");

    if (quantityButton) {
        const productId = quantityButton.dataset.qty;
        const cartItem = store.cart.find((item) => item.id === productId);
        cartItem.quantity += Number(quantityButton.dataset.change);

        if (cartItem.quantity <= 0) {
            store.cart = store.cart.filter((item) => item.id !== productId);
        }
        updateCart();
    }

    if (removeButton) {
        store.cart = store.cart.filter((item) => item.id !== removeButton.dataset.remove);
        updateCart();
    }
});

getElement("#checkoutButton").addEventListener("click", () => {
    showMessage("Demo project: checkout is not connected to payments.");
});

// Mobile navigation menu.
getElement("#menuToggle").addEventListener("click", () => {
    const navigation = getElement("#mainNav");
    const isOpen = navigation.classList.toggle("open");
    getElement("#menuToggle").setAttribute("aria-expanded", String(isOpen));
});

getElement("#mainNav").addEventListener("click", (event) => {
    if (event.target.closest("a")) {
        getElement("#mainNav").classList.remove("open");
        getElement("#menuToggle").setAttribute("aria-expanded", "false");
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeCart();
});

// Set the footer year automatically, then display the initial catalogue.
getElement("#year").textContent = new Date().getFullYear();
showProducts();
updateCart();
