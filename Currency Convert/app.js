// API configuration
const FIAT_API_URL = "https://v6.exchangerate-api.com/v6/0481b90eebc7dc3001adc1fc/latest";
const CRYPTO_API_URL = "https://api.coingecko.com/api/v3";

// DOM elements
const dropdowns = document.querySelectorAll(".dropdown select");
const btn = document.querySelector("form button");
const fromCurr = document.querySelector(".from select");
const toCurr = document.querySelector(".to select");
const msg = document.querySelector(".msg");
const swapBtn = document.querySelector("#swap-btn");

// Populate dropdowns
function populateDropdowns() {
    // Add fiat currencies
    for (let select of dropdowns) {
        // Add fiat currencies
        for (currCode in countryList) {
            let newOption = document.createElement("option");
            newOption.innerText = currCode;
            newOption.value = currCode;
            newOption.classList.add("fiat");
            if (select.name === "from" && currCode === "INR") {
                newOption.selected = "selected";
            } else if (select.name === "to" && currCode === "USD") {
                newOption.selected = "selected";
            }
            select.append(newOption);
        }

        // Add separator
        let separator = document.createElement("option");
        separator.disabled = true;
        separator.innerText = "Crypto Currency";
        select.append(separator);

        // Add cryptocurrencies
        for (let crypto of cryptoList) {
            let newOption = document.createElement("option");
            newOption.innerText = crypto.symbol.toUpperCase();
            newOption.value = crypto.id;
            newOption.classList.add("crypto");
            select.append(newOption);
        }
    }

    toCurr.querySelector('option[value="bitcoin"]').selected = true;
}

// Update flag or crypto logo
function updateImage(element) {
    let currValue = element.value;
    let img = element.parentElement.querySelector("img");

    // Check if it's a fiat currency
    if (countryList[currValue]) {
        img.src = `https://flagsapi.com/${countryList[currValue]}/flat/64.png`;
        img.style.width = "32px";
        img.style.height = "32px";
    }
    // Check if it's a cryptocurrency
    else {
        const crypto = cryptoList.find(c => c.id === currValue);
        if (crypto) {
            img.src = `https://cryptologos.cc/logos/${crypto.id}-${crypto.symbol}-logo.png`;
            img.style.width = "32px";
            img.style.height = "32px";
        }
    }
}

// Get exchange rate
async function getExchangeRate() {
    let amount = document.querySelector(".amount input");
    let amtVal = parseFloat(amount.value);

    if (isNaN(amtVal)) {
        amount.value = "1";
        amtVal = 1;
    }

    const fromValue = fromCurr.value;
    const toValue = toCurr.value;

    try {
        let rate;

        // Case 1: Both are fiat currencies
        if (countryList[fromValue] && countryList[toValue]) {
            const response = await fetch(`${FIAT_API_URL}/${fromValue}`);
            if (!response.ok) throw new Error("Fiat API request failed");
            const data = await response.json();
            rate = data.conversion_rates[toValue];
        }
        // Case 2: From fiat to crypto
        else if (countryList[fromValue]) {
            const response = await fetch(`${CRYPTO_API_URL}/simple/price?ids=${toValue}&vs_currencies=${fromValue}`);
            if (!response.ok) throw new Error("Crypto API request failed");
            const data = await response.json();
            rate = 1 / data[toValue][fromValue.toLowerCase()];
        }
        // Case 3: From crypto to fiat
        else if (countryList[toValue]) {
            const response = await fetch(`${CRYPTO_API_URL}/simple/price?ids=${fromValue}&vs_currencies=${toValue}`);
            if (!response.ok) throw new Error("Crypto API request failed");
            const data = await response.json();
            rate = data[fromValue][toValue.toLowerCase()];
        }
        // Case 4: Both are cryptocurrencies (convert through USD)
        else {
            // First get from crypto to USD
            const response1 = await fetch(`${CRYPTO_API_URL}/simple/price?ids=${fromValue}&vs_currencies=usd`);
            if (!response1.ok) throw new Error("Crypto API request failed");
            const data1 = await response1.json();
            const fromToUsd = data1[fromValue].usd;

            // Then get to crypto from USD
            const response2 = await fetch(`${CRYPTO_API_URL}/simple/price?ids=${toValue}&vs_currencies=usd`);
            if (!response2.ok) throw new Error("Crypto API request failed");
            const data2 = await response2.json();
            const usdToTo = 1 / data2[toValue].usd;

            rate = fromToUsd * usdToTo;
        }

        const finalAmount = amtVal * rate;
        const fromText = countryList[fromValue] ? fromValue : fromCurr.querySelector(`option[value="${fromValue}"]`).innerText;
        const toText = countryList[toValue] ? toValue : toCurr.querySelector(`option[value="${toValue}"]`).innerText;

        msg.innerText = `${amtVal} ${fromText} = ${finalAmount.toFixed(6)} ${toText}`;
    } catch (error) {
        msg.innerText = "Error: Unable to fetch exchange rate. Please try again later.";
        console.error(error);
    }
}

// Swap currencies
function swapCurrencies() {
    const temp = fromCurr.value;
    fromCurr.value = toCurr.value;
    toCurr.value = temp;

    updateImage(fromCurr);
    updateImage(toCurr);
    getExchangeRate();
}

// Event listeners
dropdowns.forEach(select => {
    select.addEventListener("change", (evt) => {
        updateImage(evt.target);
    });
});

btn.addEventListener("click", (evt) => {
    evt.preventDefault();
    getExchangeRate();
});

swapBtn.addEventListener("click", (evt) => {
    evt.preventDefault();
    swapCurrencies();
});

// Initialize
window.addEventListener("load", () => {
    populateDropdowns();
    updateImage(fromCurr);
    updateImage(toCurr);
    getExchangeRate();
});