let ul;
let posts;

// Handle pagination logic
const handlePagination = (postPerPage, currentPage) => {
    // Check if the ul element exists
    ul = document.querySelector(".pagination ul");
    if (!ul) {
        console.warn("Pagination element not found");
        return;
    }

    // Retrieve the posts on each call to ensure they exist
    posts = document.querySelectorAll(".post");

    if (posts.length === 0) {
        console.warn("No posts found for pagination");
        return;
    }

    updateCurrentPage(postPerPage, currentPage);

    const totalPages = Math.ceil(posts.length / postPerPage);
    let pageNumbers = generatePageNumbers(totalPages, currentPage);
    let li = '';
    li += `<li class="page ${currentPage <= 1 ? 'hidden' : ''}" 
                onclick= "handlePagination(${postPerPage}, ${currentPage - 1})">
            <span class="icon"> &lt; </span></li>`;
    for (let pageNumber of pageNumbers) {
        li += `<li class="page ${currentPage == pageNumber ? 'active' : ''}" 
                onclick= "handlePagination(${postPerPage}, ${pageNumber})">
                ${pageNumber} 
                </li>`;
    }
    li += `<li class="page ${currentPage >= totalPages ? 'hidden' : ''}"
                onclick= "handlePagination(${postPerPage}, ${currentPage + 1})">
            <span class="icon"> &gt; </span></li>`;

    ul.innerHTML = li;
}

// Function to update the visibility of posts based on the current page
const updateCurrentPage = (postPerPage, currentPage) => {
    let prevRange = (currentPage - 1) * postPerPage;
    let currRange = currentPage * postPerPage;

    posts.forEach((post, index) => {
        let isPageWithinRange = index >= prevRange && index < currRange;
        if (isPageWithinRange) {
            post.classList.remove("hide");
        } else {
            post.classList.add("hide");
        }
    });
}

// Function to generate page numbers with ellipses
const generatePageNumbers = (totalPages, currentPage) => {
    let pagination = [],
        pageNo = 1;

    while (pageNo <= totalPages) {
        let isFirstPage = pageNo <= 1,
            isLastPage = pageNo == totalPages,
            isWithinRange = pageNo >= currentPage - 1 && pageNo <= currentPage + 1;

        if (isFirstPage || isLastPage || isWithinRange) {
            pagination.push(pageNo);
        } else if (pagination[pagination.length - 1] !== "...") {
            pagination.push("...");
        }
        pageNo++;
    }
    return pagination;
}

// Function to initialize pagination once posts are created
function initializePagination(postPerPage = 6, currentPage = 1) {
    setTimeout(() => {
        const availableposts = document.querySelectorAll(".post");
        if (availableposts.length > 0) {
            console.log(`Pagination initialized with ${availableposts.length} posts`);
            handlePagination(postPerPage, currentPage);
        } else {
            console.warn("No posts found for pagination");
        }
    }, 100); // Wait 100ms for posts to be generated
}

// Initialize pagination when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
    initializePagination(6, 1);
});
