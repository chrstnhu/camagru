let ul;
let posts;

// Generates the HTML for pagination controls based on the current page and total posts
function implementPagination(posts, postPerPage, currentPage) {
  const totalPages = Math.ceil(posts.length / postPerPage);
  let pageNumbers = generatePageNumbers(totalPages, currentPage);
  let li = "";
  li += `<li class="page ${currentPage <= 1 ? "is-hidden" : ""}" 
                onclick= "handlePagination(${postPerPage}, ${currentPage - 1})">
            <span class="icon"> &lt; </span></li>`;
  for (let pageNumber of pageNumbers) {
    if (pageNumber === "...") {
      li += `<li class="page ellipsis">...</li>`;
    } else {
      li += `<li class="page ${currentPage == pageNumber ? "is-active" : ""}" 
                   onclick= "handlePagination(${postPerPage}, ${pageNumber})">
                   ${pageNumber} 
                   </li>`;
    }
  }
  li += `<li class="page ${currentPage >= totalPages ? "is-hidden" : ""}"
                onclick= "handlePagination(${postPerPage}, ${currentPage + 1})">
            <span class="icon"> &gt; </span></li>`;
  return li;
}

// Handles the logic for changing pages and updating the UI
const handlePagination = (postPerPage, currentPage) => {
  ul = document.querySelector("nav.pagination ul");
  if (!ul) {
    return; 
  }

  // Retrieve the posts on each call to ensure they exist
  posts = document.querySelectorAll(".post");

  if (posts.length === 0) {
    return; 
  }

  updateCurrentPage(postPerPage, currentPage);

  ul.innerHTML = implementPagination(posts, postPerPage, currentPage);
};

// Updates which posts are visible based on the current page
const updateCurrentPage = (postPerPage, currentPage) => {
  let prevRange = (currentPage - 1) * postPerPage;
  let currRange = currentPage * postPerPage;

  posts.forEach((post, index) => {
    let isPageWithinRange = index >= prevRange && index < currRange;
    if (isPageWithinRange) {
      post.classList.remove("is-hidden");
    } else {
      post.classList.add("is-hidden");
    }
  });
};

// Generates an array of page numbers (with ...)
const generatePageNumbers = (totalPages, currentPage) => {
  let pagination = [],
    pageNo = 1;

  while (pageNo <= totalPages) {
    let isFirstPage = pageNo <= 1;
    let isLastPage = pageNo == totalPages;
    let isWithinRange = pageNo >= currentPage - 1 && pageNo <= currentPage + 1;

    if (isFirstPage || isLastPage || isWithinRange) {
      pagination.push(pageNo);
    } else if (pagination[pagination.length - 1] !== "...") {
      pagination.push("...");
    }
    pageNo++;
  }
  return pagination;
};

// Initializes pagination after posts are created and posts are available in the DOM
function initPagination(postPerPage = 6, currentPage = 1) {
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
