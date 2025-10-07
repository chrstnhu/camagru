var current_page = 1;
var records_per_page = 6;
var objJson = [];

function prevPage() {
    if (current_page > 1) {
        current_page--;
        changePage(current_page);
    }
}

function nextPage() {
    if (current_page < numPages()) {
        current_page++;
        changePage(current_page);
    }
}

function firstPage() {
    current_page = 1;
    changePage(current_page);
}

function lastPage() {
    current_page = numPages();
    changePage(current_page);
}

function changePage(page) {
    console.log(`changePage called with page: ${page}, objJson.length: ${objJson.length}`);

    var btn_first = document.getElementById("btn_first");
    var btn_prev = document.getElementById("btn_prev");
    var btn_next = document.getElementById("btn_next");
    var btn_last = document.getElementById("btn_last");
    var listing_table = document.getElementById("listingTable");
    var page_span = document.getElementById("page");

    // Validate page
    if (page < 1) page = 1;
    if (page > numPages()) page = numPages();

    current_page = page; 

    listing_table.innerHTML = "";

    for (var i = (page - 1) * records_per_page; i < (page * records_per_page) && i < objJson.length; i++) {
        // Check if the element exists
        if (!objJson[i]) {
            console.error(`objJson[${i}] is undefined. objJson.length: ${objJson.length}`);
            break;
        }

        // Display the actual card HTML if available, otherwise show placeholder
        if (objJson[i].cardHTML) {
            listing_table.innerHTML += objJson[i].cardHTML;

            // Initialize the card functionality after adding to DOM
            (function (cardData, cardIndex) {
                setTimeout(() => {
                    if (cardData.userData && typeof updateUserCard === 'function') {
                        updateUserCard(cardData.userData, cardData.index);
                    }
                }, 50);
            })(objJson[i], i);
        } else {
            listing_table.innerHTML += `
                <div class="card-item" style="
                    padding: 20px; 
                    margin: 10px 0; a
                    border: 1px solid #e5e7eb; 
                    border-radius: 8px; 
                    background: white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                ">
                    <h3>${objJson[i].adName || 'Unnamed Card'}</h3>
                    <p>Card ${i + 1} of ${objJson.length}</p>
                </div>
            `;
        }
    }
    page_span.innerHTML = page + " / " + numPages();

    // Manage button visibility
    if (page == 1) {
        if (btn_first) btn_first.style.visibility = "hidden";
        if (btn_prev) btn_prev.style.visibility = "hidden";
    } else {
        if (btn_first) btn_first.style.visibility = "visible";
        if (btn_prev) btn_prev.style.visibility = "visible";
    }

    if (page == numPages()) {
        if (btn_next) btn_next.style.visibility = "hidden";
        if (btn_last) btn_last.style.visibility = "hidden";
    } else {
        if (btn_next) btn_next.style.visibility = "visible";
        if (btn_last) btn_last.style.visibility = "visible";
    }

    console.log(`Page changed to: ${page}/${numPages()}, current_page updated to: ${current_page}`);
}

function numPages() {
    return Math.max(1, Math.ceil(objJson.length / records_per_page));
}


// Function to initialize cards from global objJson
function initializeCards() {
    // Wait for card.js to populate window.objJson
    if (window.objJson && window.objJson.length > 0) {
        objJson = window.objJson;
        console.log("Using cards from card.js:", objJson.length, "cards");
    } else {
        console.log("Waiting for cards to be initialized...");
        setTimeout(() => {
            if (window.objJson && window.objJson.length > 0) {
                objJson = window.objJson;
                console.log("Cards loaded delayed:", objJson.length, "cards");
                changePage(1); 
            } else {
                console.log("No cards available, using fallback");
                objJson = [
                    { adName: "No cards available" }
                ];
                changePage(1);
            }
        }, 200);
    }
}

window.onload = function () {
    setTimeout(() => {
        initializeCards();
        changePage(1);
    }, 100);
};