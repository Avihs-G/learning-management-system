# Project Documentation: Book Management System

This document outlines the manual setup and usage of the database tables for a book management system, including books, users, return requests, and documents, along with user authentication and linking records using UUIDs. This assumes you are *not* using the Firebase console or CLI to manage your database directly.


## Features

* **Manual Database Management:**  Direct control over database operations using your preferred methods (e.g., SQL queries, API calls).
* **Secure User Authentication:**  Manual implementation of user registration and login with secure password hashing.  Never store passwords in plain text.
* **UUID-Based Linking:**  Uses UUIDs to create relationships between tables, ensuring data integrity and efficient querying.
* **Comprehensive Data Model:**  Includes tables for books, users, return requests, and documents, allowing for detailed tracking and management of book-related information.
* **Flexible Document Storage:**  Supports storing various document types associated with books (e.g., cover images, sample chapters).
* **Customizable Data Validation:**  Allows for implementing rigorous data validation rules specific to your application's needs.
* **Robust Backup and Restore:**  Facilitates implementing a robust backup and restore strategy to protect your data.


## Database Tables (Manual Setup)

The following describes the structure of the tables. You will need to create these tables manually using the appropriate methods for your chosen database system (e.g., direct database queries, API calls).

### 1. Books Table

| Field Name | Data Type | Description |
|---|---|---|
| bookId (Primary Key) | UUID | Unique identifier for each book. Generate this manually. |
| title | String | Title of the book. |
| author | String | Author of the book. |
| isbn | String | ISBN of the book. |
| publicationYear | Integer | Year of publication. |
| genre | String | Genre of the book (e.g., "Fiction," "Science Fiction," "Mystery"). |
| totalCopies | Integer | Total number of copies available. |
| availableCopies | Integer | Number of copies currently available for borrowing. |


### 2. Users Table

| Field Name | Data Type | Description |
|---|---|---|
| userId (Primary Key) | UUID | Unique identifier for each user. Generate this manually. |
| email | String | User's email address (used for login). |
| passwordHash | String | **Securely hashed password.** Use a strong hashing algorithm (bcrypt, Argon2) and **never store plain-text passwords.** |
| firstName | String | User's first name. |
| lastName | String | User's last name. |
| membershipType | String |  Type of user membership (e.g., "Standard", "Premium"). |
| registrationDate | Timestamp | Date and time the user registered. |


### 3. Return Requests Table

| Field Name | Data Type | Description |
|---|---|---|
| requestId (Primary Key) | UUID | Unique identifier for each return request. Generate this manually. |
| userId (Foreign Key) | UUID | ID of the user making the return request. References `userId` in the `users` table. |
| bookId (Foreign Key) | UUID | ID of the book being returned. References `bookId` in the `books` table. |
| requestDate | Timestamp | Date and time of the return request. |
| returnDate | Timestamp | Actual date and time the book was returned (can be null if not yet returned). |
| status | String | Status of the return request (e.g., "Pending," "Approved," "Rejected," "Returned"). |


### 4. Documents Table

| Field Name | Data Type | Description |
|---|---|---|
| documentId (Primary Key) | UUID | Unique identifier for each document. Generate this manually. |
| bookId (Foreign Key) | UUID | ID of the book this document is associated with (if applicable). References `bookId` in the `books` table. |
| fileName | String | Name of the file. |
| fileUrl | String | URL where the file is stored (e.g., in cloud storage). |
| documentType | String | Type of document (e.g., "Cover Image," "Sample Chapter"). |
| uploadDate | Timestamp | Date and time the document was uploaded. |



## Manual Data Management

You will be responsible for manually creating, reading, updating, and deleting records in these tables using appropriate methods for your database system (e.g., SQL queries, API calls).  This includes managing relationships between tables using the foreign keys.


## Creating Email & Password and Linking to Tables (Manual Process)

1. **User Registration (Manual):**
   - Capture the user's email and password.
   - **Hash the password securely** using a strong hashing algorithm like bcrypt or Argon2.
   - Generate a UUID for the `userId`.
   - Manually insert the user's information into the `users` table using the appropriate database commands.

2. **Linking Records (Manual):**
   - When creating records in other tables, generate a UUID for the primary key.
   - Manually insert the record into the table, ensuring that the foreign key fields (e.g., `userId`, `bookId`) reference the correct UUIDs in the related tables.


## UUID Generation

Use a UUID library in your chosen programming language to generate UUIDs manually.  For example, in Python:

```python
import uuid

new_uuid = uuid.uuid4()
print(new_uuid)