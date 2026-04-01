# Camagru API Documentation

## Overview

RESTful API for the Camagru application, a social network for sharing photos with real-time effects.

**Base URL:** `http://localhost:9001`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in headers:

```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### POST /api/auth/register

Create a new user account.

**Body:**

```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response:**

```json
{
  "message": "User registered successfully. Please check your email to verify your account.",
  "user_id": 123
}
```

#### POST /api/auth/login

User login.

**Body:**

```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**

```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": 123,
    "username": "user123",
    "email": "user@example.com"
  }
}
```

#### GET /api/auth/verify?token=<verification_token>

Verify user email.

#### POST /api/auth/forgot-password

Request a password reset.

#### POST /api/auth/reset-password

Reset password.

#### GET /api/auth/profile

Get user profile (authentication required).

#### PUT /api/auth/profile

Update user profile (authentication required).

### Posts

#### GET /api/posts

Retrieve all posts.

**Query parameters:**

- `page` (int): Page number (default: 1)
- `limit` (int): Items per page (default: 20, max: 50)

**Response:**

```json
{
  "posts": [
    {
      "id": 123,
      "user_id": 456,
      "username": "user123",
      "image_path": "/uploads/image.jpg",
      "caption": "My awesome post!",
      "likes_count": 15,
      "comments_count": 3,
      "created_at": "2023-01-01 12:00:00"
    }
  ],
  "pagination": {
    "current_page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

#### GET /api/posts/{id}

Retrieve a specific post.

#### POST /api/posts

Create a new post (authentication required).

**Content-Type:** `multipart/form-data`

**Fields:**

- `image`: Image file
- `caption`: Caption (optional)

#### PUT /api/posts

Update a post (authentication required).

#### DELETE /api/posts/{id}

Delete a post (authentication required).

#### GET /api/posts/user/{user_id}

Retrieve posts from a specific user.

#### GET /api/posts/my

Retrieve posts from the logged-in user (authentication required).

### Likes

#### POST /api/likes/toggle

Add/remove a like (authentication required).

**Body:**

```json
{
  "post_id": 123
}
```

**Response:**

```json
{
  "message": "Like added successfully",
  "action": "added",
  "likes_count": 16,
  "is_liked": true
}
```

#### GET /api/likes/post/{post_id}

Retrieve likes for a post.

#### GET /api/likes/status/{post_id}

Check like status for a post.

#### GET /api/likes/my

Retrieve likes from the logged-in user (authentication required).

### Comments

#### POST /api/comments

Create a comment (authentication required).

**Body:**

```json
{
  "post_id": 123,
  "content": "Great photo!"
}
```

#### GET /api/comments/post/{post_id}

Retrieve comments for a post.

#### PUT /api/comments

Update a comment (authentication required).

#### DELETE /api/comments/{id}

Delete a comment (authentication required).

#### GET /api/comments/my

Retrieve comments from the logged-in user (authentication required).

#### GET /api/comments/recent

Retrieve recent comments.

### Camera and Effects

#### POST /api/camera/capture

Capture a photo from webcam (authentication required).

**Body:**

```json
{
  "image_data": "data:image/png;base64,..."
}
```

#### POST /api/camera/effect

Apply an effect to an image (authentication required).

**Body:**

```json
{
  "image_path": "/uploads/image.jpg",
  "effect": "grayscale",
  "params": {
    "level": 50
  }
}
```

#### POST /api/camera/frame

Add a frame to an image (authentication required).

#### POST /api/camera/save

Save a photo as a post (authentication required).

#### GET /api/camera/effects

Retrieve list of available effects.

#### GET /api/camera/frames

Retrieve list of available frames.

### Utilities

#### GET /api/health

Server health check.

#### GET /uploads/{filename}

Serve uploaded images.

## Error Codes

- **400**: Bad Request - Invalid data
- **401**: Unauthorized - Authentication required
- **403**: Forbidden - Access denied
- **404**: Not Found - Resource not found
- **409**: Conflict - Conflict (e.g., email already used)
- **500**: Internal Server Error - Server error

## Error Response Examples

```json
{
  "error": "Invalid credentials"
}
```

```json
{
  "error": "Unauthorized",
  "message": "Please provide a valid token"
}
```

## Security

- All requests use HTTPS in production
- Passwords are hashed with bcrypt
- CORS protection configured
- File type validation for uploads
- File size limit (5MB)
- Input sanitization
- Rate limiting (to be implemented in production)

## Limits

- Maximum file size: 5MB
- Allowed file types: JPG, PNG, GIF
- Pagination limit: 50 items maximum per page
- Maximum comment length: configurable
- JWT token expiration: 24 hours
