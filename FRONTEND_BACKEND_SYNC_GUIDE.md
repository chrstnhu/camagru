# Frontend-Backend Synchronization Guide

## Architecture Overview - ASCII Diagrams

### Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CAMAGRU APPLICATION                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐          ┌─────────────────────────┐
│     CLIENT BROWSER       │          │    DOCKER CONTAINERS    │
│  (Port 9000 - Nginx)     │          │                         │
│                          │          │                         │
│  ┌────────────────────┐  │          │  ┌────────────────────┐ │
│  │   index.html       │  │          │  │   Nginx Server     │ │
│  │   - Structure      │  │          │  │   (Port 9000)      │ │
│  └────────────────────┘  │          │  └─────────┬──────────┘ │
│           │              │          │            │            │
│           ▼              │          │            ▼            │
│  ┌────────────────────┐  │  HTTP    │  ┌────────────────────┐ │
│  │   JavaScript       │◄─┼──────────┼─►│   PHP-FPM          │ │
│  │   - post.js        │  │  AJAX    │  │   (Port 9001)      │ │
│  │   - login.js       │  │  Fetch   │  │                    │ │
│  │   - capturePhoto.js│  │          │  │   ┌─────────────┐  │ │
│  │   - myPosts.js     │  │          │  │   │  api.php    │  │ │
│  └────────────────────┘  │          │  │   │  (Router)   │  │ │
│           │              │          │  │   └──────┬──────┘  │ │
│           │              │          │  │          │         │ │
│  ┌────────▼──────────┐   │          │  │   ┌──────▼──────┐  │ │
│  │   CSS Styles      │   │          │  │   │ Controllers │  │ │
│  │   - main.css      │   │          │  │   │ - User      │  │ │
│  │   - buttons.css   │   │          │  │   │ - Post      │  │ │
│  └───────────────────┘   │          │  │   │ - Image     │  │ │
│                          │          │  │   └──────┬──────┘  │ │
└──────────────────────────┘          │  │          │         │ │
                                      │  │   ┌──────▼──────┐  │ │
                                      │  │   │   Models    │  │ │
                                      │  │   │ - User.php  │  │ │
                                      │  │   │ - Post.php  │  │ │
                                      │  │   │ - Like.php  │  │ │
                                      │  │   └──────┬──────┘  │ │
                                      │  │          │         │ │
                                      │  └──────────┼─────────┘ │
                                      │             │           │
                                      │  ┌──────────▼─────────┐ │
                                      │  │   MariaDB          │ │
                                      │  │   (Port 3306)      │ │
                                      │  │   - users          │ │
                                      │  │   - posts          │ │
                                      │  │   - images         │ │
                                      │  │   - likes          │ │
                                      │  │   - comments       │ │
                                      │  └────────────────────┘ │
                                      └──────────────────────────┘
```

---

### Data Flow: Reading from Database (GET Request)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    READING DATA FROM DATABASE                           │
└─────────────────────────────────────────────────────────────────────────┘

 USER CLICKS          JAVASCRIPT          ROUTER           CONTROLLER
  "Gallery"             SENDS            MATCHES             CALLS
     │                 REQUEST            ROUTE              MODEL
     │                    │                 │                  │
     ▼                    ▼                 ▼                  ▼
┌─────────┐      ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  Click  │      │  fetch()     │   │  api.php     │   │PostController│
│ Gallery │─────►│              │   │              │   │              │
│  Button │      │  GET /api/   │──►│ matchRoute() │──►│  getPosts()  │
└─────────┘      │  posts?      │   │              │   │              │
                 │  page=1      │   │ Route found: │   │ Validates    │
                 │  limit=10    │   │ GET /api/    │   │ parameters   │
                 │              │   │ posts        │   │              │
                 └──────────────┘   └──────────────┘   └──────┬───────┘
                                                               │
                                                               │ Calls
                                                               ▼
     MODEL              DATABASE           DATABASE          MODEL
   EXECUTES              QUERY            RETURNS           RETURNS
    QUERY               EXECUTED           ROWS              DATA
       │                   │                 │                │
       ▼                   ▼                 ▼                ▼
┌──────────────┐    ┌──────────────┐  ┌──────────────┐ ┌──────────────┐
│  Post.php    │    │  MariaDB     │  │  Result Set  │ │  Array of    │
│              │    │              │  │              │ │  Posts       │
│getAllPosts() │───►│ SELECT p.*,  │─►│  10 rows     │►│ [            │
│              │    │ u.username,  │  │  returned    │ │  {id: 1,     │
│ Prepared     │    │ COUNT(l.*)   │  │              │ │   title: ""} │
│ Statement    │    │ FROM posts p │  │              │ │  ...         │
│              │    │ JOIN users u │  │              │ │ ]            │
└──────────────┘    └──────────────┘  └──────────────┘ └──────┬───────┘
                                                               │
                                                               │ Returns
                                                               ▼
 CONTROLLER         CONTROLLER           ROUTER           JAVASCRIPT
  FORMATS            SENDS               SENDS             RECEIVES
  RESPONSE          RESPONSE            RESPONSE           RESPONSE
     │                 │                   │                  │
     ▼                 ▼                   ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Add metadata │  │ HTTP 200 OK  │  │ Sends to     │  │ fetch()      │
│ Format JSON  │─►│ Content-Type:│─►│ browser      │─►│ .then(data)  │
│ {            │  │ application/ │  │              │  │              │
│  posts: [...],  │ json         │  │ JSON body    │  │ displayPosts │
│  total: 50,  │  │              │  │ with posts   │  │ (data.posts) │
│  page: 1     │  │ Response     │  │              │  │              │
│ }            │  │ body: JSON   │  │              │  │ Updates DOM  │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘

 TOTAL TIME: ~50-200ms
```

---

### Data Flow: Writing to Database (POST Request)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WRITING DATA TO DATABASE                              │
└─────────────────────────────────────────────────────────────────────────┘

 USER CAPTURES       JAVASCRIPT           ROUTER          CONTROLLER
   PHOTO            PREPARES            MATCHES            RECEIVES
     │               DATA                ROUTE              DATA
     ▼                 │                   │                  │
┌─────────┐            ▼                   ▼                  ▼
│  Click  │    ┌──────────────┐    ┌────────────────┐   ┌───────────────┐
│ Capture │    │  canvas.     │    │  api.php       │   │ImageController│
│ Button  │───►│  toDataURL() │    │                │   │               │
└─────────┘    │              │    │ matchRoute()   │   │ saveImage()   │
               │ Get session  │    │                │   │               │
               │ user_id      │───►│ Route found:   │──►│ Validates:    │
               │              │    │ POST /api/     │   │ - user_id     │
               │ fetch(       │    │ images         │   │ - image_data  │
               │  '/api/      │    │                │   │ - format      │
               │  images',    │    │ Calls:         │   │               │
               │  {           │    │ ImageController│   │ Generates     │
               │   method:    │    │ ::saveImage()  │   │ filename      │
               │   'POST',    │    │                │   │               │
               │   body:      │    │                │   │               │
               │   JSON.      │    │                │   │               │
               │   stringify({│    │                │   │               │
               │    user_id,  │    │                │   │               │
               │    image_data│    │                │   │               │
               │   })         │    │                │   │               │
               │  }           │    │                │   │               │
               │ )            │    │                │   │               │
               └──────────────┘    └────────────────┘   └──────┬────────┘
                                                               │
                                                               │ Calls
                                                               ▼
    MODEL              DATABASE          DATABASE          CONTROLLER
  EXECUTES             INSERTS           CONFIRMS           RETURNS
   INSERT              NEW ROW           SUCCESS             ID
     │                   │                 │                 │
     ▼                   ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Prepared     │  │  MariaDB     │  │ INSERT OK    │  │ Get last     │
│ Statement    │  │              │  │              │  │ insert ID    │
│              │─►│ INSERT INTO  │─►│ 1 row        │─►│              │
│ INSERT INTO  │  │ images       │  │ affected     │  │ $imageId =   │
│ images (     │  │ (user_id,    │  │              │  │ lastInsertId │
│  user_id,    │  │  image_path, │  │ New ID: 42   │  │ ()           │
│  image_data, │  │  image_data, │  │              │  │              │
│  caption     │  │  caption)    │  │              │  │ Returns: 42  │
│ ) VALUES (   │  │ VALUES       │  │              │  │              │
│  :user_id,   │  │ (?, ?, ?, ?) │  │              │  │              │
│  :image_data │  │              │  │              │  │              │
│ )            │  │              │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘  └──────┬───────┘
                                                             │
                                                             │ Sends
                                                             ▼
 CONTROLLER         ROUTER            JAVASCRIPT         JAVASCRIPT
   SENDS           SENDS              RECEIVES           UPDATES
  RESPONSE        RESPONSE            RESPONSE             UI
     │               │                   │                  │
     ▼               ▼                   ▼                  ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐  ┌──────────────┐
│ HTTP 201     │ │ Forwards to  │ │ fetch()      │  │ Photo saved! │
│ Created      │►│ browser      │►│ .then(data)  │─►│              │
│              │ │              │ │              │  │ Refresh      │
│ {            │ │ JSON body    │ │ if(data.     │  │ gallery      │
│  success:    │ │ with         │ │  success) {  │  │              │
│  true,       │ │ response     │ │   show       │  │ loadMyPhotos │
│  image_id:   │ │              │ │   success    │  │ ()           │
│  42          │ │              │ │ }            │  │              │
│ }            │ │              │ │              │  │ Display new  │
└──────────────┘ └──────────────┘ └──────────────┘  │ photo in DOM │
                                                    └──────────────┘

 TOTAL TIME: ~100-500ms (depends on image size)
```

---

### Router Pattern Matching

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ROUTER MATCHING LOGIC                            │
└─────────────────────────────────────────────────────────────────────────┘

 INCOMING REQUEST                  REGISTERED ROUTES
      │                                   │
      ▼                                   ▼
┌──────────────────┐            ┌────────────────────────┐
│ Method: POST     │            │ Route 1:               │
│ Path: /api/      │            │  POST /api/auth/login  │
│       posts/     │            │                        │
│       123/like   │            │ Route 2:               │
└────────┬─────────┘            │  GET /api/posts        │
         │                      │                        │
         │                      │ Route 3:               │
         │  1. Check Method     │  POST /api/posts/*/    │
         └─────────────────────►│       like             │
                                │                        │
                                │ Route 4:               │
                                │  DELETE /api/images/*  │
                                └───────────┬────────────┘
                                            │
                                            │ 2. Match Pattern
                                            ▼
         ┌─────────────────────────────────────────────┐
         │  For each route:                            │
         │                                             │
         │  if (route.method !== 'POST')               │
         │    → Skip                                   │
         │                                             │
         │  if (route.path contains '*')               │
         │    → Convert to regex:                      │
         │      /api/posts/*/like                      │
         │      becomes:                               │
         │      #^/api/posts/[^/]+/like$#              │
         │                                             │
         │    → Test against actual path:              │
         │      /api/posts/123/like                    │
         │                                             │
         │    → MATCH! ✓                               │
         │                                             │
         │  Extract variables:                         │
         │    postId = 123 (from path segment 3)       │
         └──────────────────┬──────────────────────────┘
                            │
                            │ 3. Execute Route
                            ▼
         ┌──────────────────────────────────────────────┐
         │  Create controller instance:                 │
         │  $controller = new PostController();         │
         │                                              │
         │  Call action method:                         │
         │  $controller->toggleLike();                  │
         │                                              │
         │  Inside toggleLike():                        │
         │  - Extract postId from URL                   │
         │  - Validate user session                     │
         │  - Call model methods                        │
         │  - Return JSON response                      │
         └──────────────────────────────────────────────┘

EXAMPLES:

┌────────────────────────────────────────────────────────────────┐
│ Request: GET /api/posts?page=1&limit=10                        │
│ Matches: GET /api/posts                                        │
│ Action:  PostController::getPosts()                            │
│ Variables: $_GET['page'] = 1, $_GET['limit'] = 10              │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ Request: POST /api/posts/456/like                              │
│ Matches: POST /api/posts/*/like                                │
│ Action:  PostController::toggleLike()                          │
│ Variables: postId = 456 (extracted from URL)                   │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ Request: DELETE /api/images/789                                │
│ Matches: DELETE /api/images/*                                  │
│ Action:  ImageController::deleteImage()                        │
│ Variables: imageId = 789 (extracted from URL)                  │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ Request: GET /api/images/user/101                              │
│ Matches: GET /api/images/user/*                                │
│ Action:  ImageController::getUserImages()                      │
│ Variables: userId = 101 (extracted from URL)                   │
└────────────────────────────────────────────────────────────────┘
```

---

### Authentication Flow with Sessions & Cookies

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION SYNCHRONIZATION                      │
└─────────────────────────────────────────────────────────────────────────┘

LOGIN FLOW:

 Frontend                Backend                Database            Frontend
   Form                 Validates              Checks User          Stores
   │                       │                       │                Session
   ▼                       ▼                       ▼                   │
┌──────────┐        ┌───────────────┐       ┌───────────────┐     ┌──────────┐
│ User     │        │ UserController│       │ users table   │     │ Cookie:  │
│ enters:  │        │               │       │               │     │          │
│          │        │ login()       │       │ SELECT *      │     │ user_    │
│ Email:   │───────►│               │──────►│ FROM users    │     │ session= │
│ test@    │ POST   │ 1. Get input  │       │ WHERE email   │     │ {        │
│ test.com │ /api/  │ 2. Hash pwd   │       │ = ?           │     │  user_id │
│          │ auth/  │ 3. Query DB   │       │               │     │  username│
│ Password:│ login  │ 4. Verify     │       │ Returns:      │     │  email   │
│ ****     │        │    password   │       │ {             │     │  logged_ │
└──────────┘        │               │       │  id: 5,       │     │  in:true │
                    │ 5. Create     │       │  username:    │     │ }        │
                    │    PHP        │◄──────│  "john",      │     │          │
                    │    session    │       │  email: "...",│     │ Max-age: │
                    │               │       │  password:    │     │ 86400    │
                    │ session_      │       │  "$2y$..."    │     │ (24h)    │
                    │ start();      │       │ }             │     │          │
                    │               │       └───────────────┘     └──────────┘
                    │ $_SESSION[    │              │                  ▲
                    │  'user_id'    │              │                  │
                    │ ] = 5;        │              │                  │
                    │               │              │                  │
                    │ 6. Return     │              │                  │
                    │    JSON       │──────────────┴──────────────────┘
                    │    response   │  HTTP 200 OK
                    │    with user  │  {
                    │    data       │   success: true,
                    └───────────────┘   user: {id:5, username:"john"}
                                       }

SUBSEQUENT REQUESTS (Authenticated):

 Frontend               Backend              Database
 Reads Cookie         Checks Session       Uses User ID
   │                       │                    │
   ▼                       ▼                    ▼
┌───────────────┐    ┌──────────────┐    ┌──────────────┐
│ getUserSession│    │ session_     │    │ SELECT *     │
│ ()            │    │ start();     │    │ FROM images  │
│               │    │              │    │ WHERE        │
│ Parse cookie: │    │ if(!isset(   │    │ user_id = 5  │
│ {             │───►│  $_SESSION[  │───►│              │
│  user_id: 5,  │    │   'user_id'  │    │ Returns user's
│  username:    │    │  ])) {       │    │ photos only  │
│  "john"       │    │   return 401 │    │              │
│ }             │    │ }            │    │              │
│               │    │              │    │              │
│ Use in fetch: │    │ $userId =    │    │              │
│ /api/images/  │    │ $_SESSION[   │    │              │
│ user/5        │    │  'user_id'   │    │              │
└───────────────┘    │ ];           │    └──────────────┘
                     └──────────────┘

DUAL SYNC (Frontend Cookie + Backend Session):

┌────────────────────────────────────────────────────────────┐
│ Why use both Cookie (JS) and Session (PHP)?                │
│                                                            │
│ COOKIE (Frontend):                                         │
│ - Used by JavaScript to know if user is logged in          │
│ - Shows/hides login button vs profile avatar               │
│ - Quick access to user_id for API calls                    │
│ - No server round-trip needed                              │
│                                                            │
│ SESSION (Backend):                                         │
│ - Server-side validation (more secure)                     │
│ - Cannot be modified by user                               │
│ - Used to authorize database operations                    │
│ - Stored on server, harder to tamper with                  │
│                                                            │
│ SYNC MECHANISM:                                            │
│ - On login: Set BOTH cookie + session                      │
│ - On page load: Check cookie, if exists show profile       │
│ - On API call: Backend checks session (ignores cookie)     │
│ - On logout: Clear BOTH cookie + session                   │
└────────────────────────────────────────────────────────────┘
```

---

### Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ERROR HANDLING FLOW                              │
└─────────────────────────────────────────────────────────────────────────┘

SCENARIO: User tries to delete photo without being logged in

Frontend          Router          Controller        Response         Frontend
  │                 │                 │                │               │
  ▼                 ▼                 ▼                ▼               ▼
┌──────────┐  ┌──────────┐    ┌──────────────┐ ┌──────────┐  ┌──────────────┐
│ User     │  │ Matches  │    │ Check        │ │ HTTP 401 │  │ catch(error) │
│ clicks   │  │ DELETE   │    │ session      │ │          │  │              │
│ delete   │─►│ /api/    │───►│              │►│ {        │─►│ if(response. │
│ button   │  │ images/* │    │ session_     │ │  success:│  │   status===  │
└──────────┘  └──────────┘    │ start();     │ │  false,  │  │   401) {     │
                              │              │ │  error:  │  │   showLogin  │
                              │ if(!isset(   │ │  "Not    │  │   Popup();   │
                              │  $_SESSION[  │ │  logged  │  │ }            │
                              │   'user_id'  │ │  in"     │  └──────────────┘
                              │ ])) {        │ │ }        │
                              │   return 401;│ └──────────┘
                              │ }            │
                              └──────────────┘

SCENARIO: Database connection error

Frontend          Router          Controller        Database        Response
  │                 │                 │                │               │
  ▼                 ▼                 ▼                ▼               ▼
┌──────────┐  ┌───────────┐    ┌──────────────┐ ┌──────────┐  ┌──────────────┐
│ fetch()  │  │ Routes    │    │ try {        │ │ ERROR:   │  │ HTTP 500     │
│ /api/    │─►│ to        │───►│              │►│ Can't    │  │              │
│ posts    │  │ Post      │    │  $posts =    │ │ connect  │  │ {            │
└──────────┘  │ Controller│    │  $this->post │ │ to DB    │─►│  success:    │
              └───────────┘    │  ->getAll(); │ └──────────┘  │  false,      │
                               │              │               │  error:      │
                               │ } catch(     │               │  "Database   │
                               │  Exception   │               │  error"      │
                               │  $e) {       │               │ }            │
                               │   return 500;│               └──────┬───────┘
                               │ }            │                      │
                               └──────────────┘                      │
                                                                     ▼
                                                              ┌──────────────┐
Frontend                                                      │ Frontend     │
  │                                                           │ catch block  │
  ▼                                                           │              │
┌──────────────┐                                              │ showError    │
│ catch(error) │◄─────────────────────────────────────────────│ Alert(       │
│              │                                              │  'Server     │
│ console.     │                                              │  error'      │
│ error(error);│                                              │ )            │
│              │                                              └──────────────┘
│ showError    │
│ Alert();     │
└──────────────┘

COMMON HTTP STATUS CODES:

┌─────┬────────────────┬────────────────────────────────────────────┐
│Code │ Name           │ When to Use                                │
├─────┼────────────────┼────────────────────────────────────────────┤
│ 200 │ OK             │ Successful GET, DELETE, PUT                │
│ 201 │ Created        │ Successful POST (new resource created)     │
│ 400 │ Bad Request    │ Invalid input, missing required fields     │
│ 401 │ Unauthorized   │ Not logged in, session expired             │
│ 403 │ Forbidden      │ Logged in but no permission                │
│ 404 │ Not Found      │ Resource doesn't exist, route not found    │
│ 409 │ Conflict       │ Email already exists, duplicate entry      │
│ 500 │ Server Error   │ Database error, unexpected PHP exception   │
└─────┴────────────────┴────────────────────────────────────────────┘
```

---

## 1. Database → PHP → JavaScript (Reading Data)

### Step 1: Database Query (Model Layer)

**File: `srcs/server/models/Post.php`**

```php
class Post {
    private $db;

    public function getAllPosts($limit, $offset, $userId = null) {
        $query = "SELECT p.*, u.username,
                  COUNT(DISTINCT l.id) as likes_count,
                  COUNT(DISTINCT c.id) as comments_count";

        if ($userId) {
            $query .= ", EXISTS(
                SELECT 1 FROM likes
                WHERE post_id = p.id AND user_id = :user_id
            ) as is_liked";
        }

        $query .= " FROM posts p
                   LEFT JOIN users u ON p.user_id = u.id
                   LEFT JOIN likes l ON p.id = l.post_id
                   LEFT JOIN comments c ON p.id = c.post_id
                   GROUP BY p.id
                   ORDER BY p.created_at DESC
                   LIMIT :limit OFFSET :offset";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);

        if ($userId) {
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        }

        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
```

### Step 2: Controller Processing

**File: `srcs/server/controllers/PostController.php`**

```php
class PostController {
    public function getPosts() {
        try {
            // Get parameters from URL
            $limit = $_GET['limit'] ?? 10;
            $page = $_GET['page'] ?? 1;
            $offset = ($page - 1) * $limit;

            // Get logged-in user from session/cookie
            session_start();
            $userId = $_SESSION['user_id'] ?? null;

            // Fetch data from model
            $posts = $this->post->getAllPosts($limit, $offset, $userId);

            // Add additional data
            foreach ($posts as &$post) {
                $post['avatar'] = "assets/profile/photo1.jpg";
                if (!$userId && !isset($post['is_liked'])) {
                    $post['is_liked'] = false;
                }
            }

            // Send JSON response
            $this->sendResponse(200, [
                'posts' => $posts,
                'total' => $total,
                'page' => (int)$page
            ]);

        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => $e->getMessage()]);
        }
    }

    private function sendResponse($code, $data) {
        http_response_code($code);
        header('Content-Type: application/json');
        echo json_encode($data);
    }
}
```

### Step 3: Router Configuration

**File: `srcs/server/routes/api.php`**

```php
$router = new Router();

// Register route: GET /api/posts → PostController::getPosts()
$router->addRoute('GET', '/api/posts', 'PostController', 'getPosts');

// Handle incoming request
$router->handle();
```

**Router Logic:**

```php
private function matchRoute($route, $method, $path) {
    if ($route['method'] !== $method) return false;

    // Exact match
    if ($route['path'] === $path) return true;

    // Wildcard match (e.g., /api/posts/*/like matches /api/posts/123/like)
    if (strpos($route['path'], '*') !== false) {
        $pattern = str_replace('*', '[^/]+', $route['path']);
        $pattern = '#^' . $pattern . '$#';
        return preg_match($pattern, $path);
    }

    return false;
}
```

### Step 4: JavaScript Fetch (Frontend)

**File: `srcs/client/public/srcs/js/post.js`**

```javascript
async function loadPosts(page = 1) {
  try {
    // Make HTTP request to API
    const response = await fetch(`/api/posts?page=${page}&limit=10`);

    // Check if response is OK
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Parse JSON response
    const data = await response.json();

    // Use data in frontend
    console.log("Loaded posts:", data.posts);
    displayPosts(data.posts);
  } catch (error) {
    console.error("Error loading posts:", error);
    showErrorAlert("Failed to load posts");
  }
}

function displayPosts(posts) {
  const container = document.getElementById("posts-container");
  container.innerHTML = "";

  posts.forEach((post) => {
    const postElement = createPostElement(post);
    container.appendChild(postElement);
  });
}
```

---

## 2. JavaScript → PHP → Database (Writing Data)

### Step 1: Frontend Sends Data

**File: `srcs/client/public/srcs/js/capturePhoto.js`**

```javascript
async function savePhotoToDatabase(dataUrl, userId) {
  try {
    // Prepare data to send
    const requestBody = {
      user_id: userId,
      image_data: dataUrl, // base64 string
      caption: "My photo",
    };

    // Send POST request with JSON body
    const response = await fetch("/api/images", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    // Parse response
    const result = await response.json();

    if (result.success) {
      console.log("✅ Photo saved! ID:", result.image_id);
      showSuccessAlert("Photo saved successfully");
    } else {
      console.error("❌ Failed:", result.error);
      showErrorAlert(result.error);
    }
  } catch (error) {
    console.error("❌ Network error:", error);
    showErrorAlert("Failed to save photo");
  }
}
```

### Step 2: Router Routes Request

**File: `srcs/server/routes/api.php`**

```php
// Route: POST /api/images → ImageController::saveImage()
$router->addRoute('POST', '/api/images', 'ImageController', 'saveImage');
```

### Step 3: Controller Receives & Validates

**File: `srcs/server/controllers/ImageController.php`**

```php
class ImageController {
    public function saveImage() {
        try {
            // Get JSON input from request body
            $input = json_decode(file_get_contents('php://input'), true);

            // Validate required fields
            if (!isset($input['user_id']) || !isset($input['image_data'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Missing required fields'
                ]);
                return;
            }

            // Extract data
            $userId = intval($input['user_id']);
            $imageData = $input['image_data'];
            $caption = $input['caption'] ?? '';

            // Validate image format
            if (strpos($imageData, 'data:image') !== 0) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Invalid image format'
                ]);
                return;
            }

            // Generate unique filename
            $timestamp = time();
            $randomString = bin2hex(random_bytes(8));
            $imagePath = "uploads/images/{$userId}_{$timestamp}_{$randomString}.png";

            // Save to database via prepared statement
            $stmt = $this->db->prepare("
                INSERT INTO images (user_id, image_path, image_data, caption, created_at)
                VALUES (:user_id, :image_path, :image_data, :caption, NOW())
            ");

            $stmt->execute([
                ':user_id' => $userId,
                ':image_path' => $imagePath,
                ':image_data' => $imageData,
                ':caption' => $caption
            ]);

            // Get inserted ID
            $imageId = $this->db->lastInsertId();

            // Send success response
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Image saved successfully',
                'image_id' => $imageId,
                'image_path' => $imagePath
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Database error: ' . $e->getMessage()
            ]);
        }
    }
}
```

---

## 3. Real-Time Synchronization Patterns

### Pattern A: After Write, Refresh Data

```javascript
async function captureAndSavePhoto() {
  // 1. Capture photo
  const imageData = canvas.toDataURL("image/png");

  // 2. Save to database
  await savePhotoToDatabase(imageData, userId);

  // 3. Refresh gallery to show new photo
  await loadMyPhotos();
}

async function loadMyPhotos() {
  const response = await fetch(`/api/images/user/${userId}`);
  const data = await response.json();
  displayPhotos(data.images);
}
```

### Pattern B: Optimistic UI Update

```javascript
async function toggleLike(postId) {
  // 1. Update UI immediately (optimistic)
  const likeBtn = document.getElementById(`like-${postId}`);
  const isLiked = likeBtn.classList.toggle("liked");
  const countElement = document.getElementById(`count-${postId}`);
  let count = parseInt(countElement.textContent);
  countElement.textContent = isLiked ? count + 1 : count - 1;

  try {
    // 2. Send request to backend
    const response = await fetch(`/api/posts/${postId}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();

    // 3. Sync with server response
    if (result.success) {
      countElement.textContent = result.likes_count;
      if (result.is_liked !== isLiked) {
        likeBtn.classList.toggle("liked");
      }
    } else {
      // Rollback on error
      likeBtn.classList.toggle("liked");
      countElement.textContent = count;
    }
  } catch (error) {
    // Rollback on error
    likeBtn.classList.toggle("liked");
    countElement.textContent = count;
    showErrorAlert("Failed to update like");
  }
}
```

### Pattern C: Delete with Confirmation

```javascript
async function deletePhoto(photoId, photoElement) {
  // 1. Ask confirmation
  const confirmed = confirm("Are you sure you want to delete this photo?");
  if (!confirmed) {
    return;
  }

  try {
    // 2. Send DELETE request
    const response = await fetch(`/api/images/${photoId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();

    if (result.success) {
      // 3. Remove from UI only after server confirms
      photoElement.remove();
      console.log("✅ Photo deleted from database");

      // 4. Check if gallery is empty
      const gallery = document.getElementById("my-photos-gallery");
      if (gallery.children.length === 0) {
        gallery.innerHTML = "<p>No photos yet.</p>";
      }
    } else {
      showErrorAlert("Failed to delete: " + result.error);
    }
  } catch (error) {
    showErrorAlert("Network error");
  }
}
```

---

## 4. Session/Authentication Synchronization

### Backend Session (PHP)

```php
// Start session
session_start();

// Store user data after login
$_SESSION['user_id'] = $user['id'];
$_SESSION['username'] = $user['username'];
$_SESSION['email'] = $user['email'];

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    return;
}

// Get current user
$userId = $_SESSION['user_id'];
```

### Frontend Session (Cookie + JavaScript)

```javascript
// After login, store session in cookie
function storeSession(userData) {
  const sessionData = {
    user_id: userData.id,
    username: userData.username,
    email: userData.email,
    logged_in: true,
  };

  // Store as cookie (24h expiry)
  document.cookie = `user_session=${JSON.stringify(sessionData)}; path=/; max-age=86400`;
}

// Retrieve session from cookie
function getUserSession() {
  const cookies = document.cookie.split("; ");
  const sessionCookie = cookies.find((c) => c.startsWith("user_session="));

  if (sessionCookie) {
    try {
      const sessionData = sessionCookie.split("=")[1];
      return JSON.parse(decodeURIComponent(sessionData));
    } catch (error) {
      return null;
    }
  }
  return null;
}

// Use session data
const session = getUserSession();
if (session && session.logged_in) {
  console.log("User logged in:", session.username);
  loadUserData(session.user_id);
} else {
  console.log("User not logged in");
  showLoginButton();
}
```

---

## 5. Error Handling & HTTP Status Codes

### Backend Error Responses

```php
// 200 OK - Success
http_response_code(200);
echo json_encode(['success' => true, 'data' => $data]);

// 201 Created - Resource created
http_response_code(201);
echo json_encode(['success' => true, 'id' => $newId]);

// 400 Bad Request - Invalid input
http_response_code(400);
echo json_encode(['success' => false, 'error' => 'Missing required fields']);

// 401 Unauthorized - Not logged in
http_response_code(401);
echo json_encode(['success' => false, 'error' => 'Authentication required']);

// 404 Not Found - Resource not found
http_response_code(404);
echo json_encode(['success' => false, 'error' => 'Resource not found']);

// 500 Internal Server Error - Database/server error
http_response_code(500);
echo json_encode(['success' => false, 'error' => 'Server error']);
```

### Frontend Error Handling

```javascript
async function fetchData() {
  try {
    const response = await fetch("/api/posts");

    // Check HTTP status
    if (!response.ok) {
      if (response.status === 401) {
        showLoginPopup();
        return;
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // Check success flag
    if (!data.success) {
      throw new Error(data.error || "Unknown error");
    }

    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    showErrorAlert(error.message);
    return null;
  }
}
```

---

## 6. Complete Flow Example: Like Feature

### 1. Database Schema

```sql
CREATE TABLE likes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_like (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (post_id) REFERENCES posts(id)
);
```

### 2. Model (PHP)

```php
class Like {
    public function toggleLike($userId, $postId) {
        // Check if like exists
        $stmt = $this->db->prepare("
            SELECT id FROM likes
            WHERE user_id = :user_id AND post_id = :post_id
        ");
        $stmt->execute([':user_id' => $userId, ':post_id' => $postId]);
        $exists = $stmt->fetch();

        if ($exists) {
            // Unlike: delete row
            $stmt = $this->db->prepare("
                DELETE FROM likes
                WHERE user_id = :user_id AND post_id = :post_id
            ");
        } else {
            // Like: insert row
            $stmt = $this->db->prepare("
                INSERT INTO likes (user_id, post_id)
                VALUES (:user_id, :post_id)
            ");
        }

        return $stmt->execute([':user_id' => $userId, ':post_id' => $postId]);
    }

    public function getLikeCount($postId) {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) as count FROM likes WHERE post_id = :post_id
        ");
        $stmt->execute([':post_id' => $postId]);
        return $stmt->fetch()['count'];
    }

    public function isLikedByUser($userId, $postId) {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) as count FROM likes
            WHERE user_id = :user_id AND post_id = :post_id
        ");
        $stmt->execute([':user_id' => $userId, ':post_id' => $postId]);
        return $stmt->fetch()['count'] > 0;
    }
}
```

### 3. Controller (PHP)

```php
class PostController {
    public function toggleLike() {
        session_start();

        if (!isset($_SESSION['user_id'])) {
            $this->sendResponse(401, ['error' => 'Not logged in']);
            return;
        }

        // Extract post ID from URL: /api/posts/123/like
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $pathParts = explode('/', $path);
        $postId = $pathParts[3] ?? null;

        if (!$postId || !is_numeric($postId)) {
            $this->sendResponse(400, ['error' => 'Invalid post ID']);
            return;
        }

        $userId = $_SESSION['user_id'];

        try {
            $success = $this->like->toggleLike($userId, $postId);

            if ($success) {
                $isLiked = $this->like->isLikedByUser($userId, $postId);
                $likesCount = $this->like->getLikeCount($postId);

                $this->sendResponse(200, [
                    'success' => true,
                    'is_liked' => $isLiked,
                    'likes_count' => $likesCount
                ]);
            }
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => $e->getMessage()]);
        }
    }
}
```

### 4. Route (PHP)

```php
$router->addRoute('POST', '/api/posts/*/like', 'PostController', 'toggleLike');
```

### 5. Frontend (JavaScript)

```javascript
async function toggleLike(postId) {
  const likeBtn = document.getElementById(`like-btn-${postId}`);
  const countSpan = document.getElementById(`like-count-${postId}`);

  try {
    const response = await fetch(`/api/posts/${postId}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (response.status === 401) {
      showLoginPopup();
      return;
    }

    const result = await response.json();

    if (result.success) {
      // Update UI with server data
      countSpan.textContent = result.likes_count;

      if (result.is_liked) {
        likeBtn.classList.add("liked");
        likeBtn.querySelector("i").classList.replace("fa-regular", "fa-solid");
      } else {
        likeBtn.classList.remove("liked");
        likeBtn.querySelector("i").classList.replace("fa-solid", "fa-regular");
      }
    }
  } catch (error) {
    console.error("Like error:", error);
    showErrorAlert("Failed to update like");
  }
}
```

---

## 7. Best Practices for Sync

### ✅ DO

1. **Always validate data on backend** - Never trust client input
2. **Use prepared statements** - Prevent SQL injection
3. **Return consistent JSON format** - `{ success: bool, data/error: ... }`
4. **Use appropriate HTTP status codes** - 200, 201, 400, 401, 404, 500
5. **Handle errors gracefully** - try/catch on both sides
6. **Use async/await** - Cleaner than promises
7. **Show loading states** - Better UX during requests
8. **Validate on frontend too** - Faster feedback to user
9. **Use semantic HTTP methods** - GET (read), POST (create), PUT/PATCH (update), DELETE (delete)
10. **Log errors** - console.error() on frontend, error_log() on backend

### ❌ DON'T

1. **Don't store passwords in plain text** - Always hash with bcrypt
2. **Don't trust client-side validation only** - Always validate on server
3. **Don't expose sensitive data** - Filter response data
4. **Don't ignore errors** - Always handle try/catch
5. **Don't use $\_GET for sensitive operations** - Use POST with JSON body
6. **Don't concatenate SQL strings** - Use prepared statements
7. **Don't forget CORS headers** - Required for API access
8. **Don't block UI during requests** - Use async operations
9. **Don't forget to sanitize HTML** - Prevent XSS attacks
10. **Don't use global variables** - Encapsulate in functions/classes

---

## 8. Debugging Tips

### Backend Debugging

```php
// Enable error reporting in development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Log to PHP error log
error_log("Debug: User ID = " . $userId);
error_log("Debug: SQL Query = " . $query);

// Return debug info in response (development only!)
echo json_encode([
    'success' => false,
    'error' => 'Failed',
    'debug' => [
        'sql' => $query,
        'params' => $params,
        'trace' => debug_backtrace()
    ]
]);
```

### Frontend Debugging

```javascript
// Log all fetch requests
async function debugFetch(url, options = {}) {
  console.log("🔵 Request:", url, options);

  const response = await fetch(url, options);
  const data = await response.json();

  console.log("🟢 Response:", {
    status: response.status,
    data: data,
  });

  return { response, data };
}

// Use in code
const { response, data } = await debugFetch("/api/posts");
```

### Network Tab (Browser DevTools)

- **Check request URL** - Is it correct?
- **Check request method** - GET, POST, DELETE?
- **Check request headers** - Content-Type correct?
- **Check request body** - Data sent correctly?
- **Check response status** - 200, 400, 500?
- **Check response body** - What did server return?

---

## Summary

**Data Flow:**

```
Frontend JS → fetch() → Router → Controller → Model → Database
Database → Model → Controller → JSON → fetch() → Frontend JS
```

**Key Points:**

- Router matches URLs to Controllers
- Controllers handle HTTP logic
- Models handle database queries
- Frontend uses fetch() for AJAX
- Always use async/await
- Always validate on both sides
- Always handle errors
- Keep frontend and backend in sync
