# CampusFind – College Lost & Found Item Tracker

This updated version is designed for a college Project Review-3 and includes:

- Student / Lecturer login
- Remember me
- Forgot password
- Student / Lecturer registration
- Search bar after login
- Lost and Found item cards
- Category and Lost/Found filters
- Report Lost / Found item
- Claim / contact request
- Recovered status
- Finder points
- SQLite database

## Run

1. Extract the ZIP.
2. Open the extracted folder in VS Code.
3. Open Terminal in that folder.
4. Run:

```bash
npm install
node server.js
```

5. Open:

```text
http://localhost:3000
```

## Demo accounts

Student:
student@college.edu
student123

Lecturer:
lecturer@college.edu
lecturer123

## Finder point logic

If a user reports an item as Found, the card shows that the finder can earn 25 points. After the owner collects it, the same user who uploaded the Found report clicks **Mark returned**. The system changes the item to Recovered and adds +25 points to that user's account.

## Note

The Forgot Password flow is a project/demo reset feature. For a real college deployment, replace it with college-email OTP or an official identity-verification flow.
