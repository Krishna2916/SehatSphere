# Firebase Authentication Setup Guide

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `SehatSphere` (or your choice)
4. Disable Google Analytics (optional)
5. Click **"Create project"**

## Step 2: Enable Authentication

1. In Firebase Console, click **"Authentication"** in left sidebar
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab
4. Enable **"Email/Password"** provider
5. Click **"Save"**

## Step 3: Register Web App

1. In Firebase Console, go to Project Settings (⚙️ icon)
2. Scroll down to **"Your apps"** section
3. Click **"Web"** icon (`</>`)
4. Register app with nickname: `SehatSphere Web`
5. Copy the Firebase configuration object

## Step 4: Update Configuration

Open `firebase-config.js` and replace with your credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",              // From Firebase Console
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Step 5: Configure Authorized Domains

1. Go to **Authentication** > **Settings** > **Authorized domains**
2. Add your domain: `krishna2916.github.io`
3. Click **"Add domain"**

## Step 6: Test Authentication

1. Deploy your updated code to GitHub Pages
2. Go to your site: https://krishna2916.github.io/SehatSphere/
3. Try creating an account:
   - Enter email and password
   - Fill in name and role
   - Click **"Create Account"**
4. Check Firebase Console > Authentication > Users to see new user

## Features Enabled

✅ **Email/Password Authentication**
- Secure user registration
- Login with email and password
- Password reset (can be added)
- Email verification (can be added)

✅ **User Management**
- Firebase handles authentication
- Health ID linked to Firebase UID
- User data stored in localStorage
- Automatic session management

✅ **Security**
- Encrypted passwords
- Secure token-based auth
- Protected user data
- HTTPS required

## Optional Enhancements

### Enable Password Reset

Add this button to login section:
```html
<button id="resetPasswordBtn" class="btn-secondary">Reset Password</button>
```

Add this code to script.js:
```javascript
$('resetPasswordBtn').addEventListener('click', async () => {
  const email = $('emailInput').value.trim();
  if (!email) {
    alert('Please enter your email address');
    return;
  }
  try {
    await window.auth.sendPasswordResetEmail(email);
    alert('Password reset email sent! Check your inbox.');
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
});
```

### Enable Email Verification

After signup, add:
```javascript
await user.sendEmailVerification();
alert('Verification email sent! Please check your inbox.');
```

## Troubleshooting

### Error: "auth/operation-not-allowed"
- Go to Firebase Console > Authentication > Sign-in method
- Make sure Email/Password is enabled

### Error: "auth/invalid-api-key"
- Check that firebase-config.js has correct API key
- Make sure you copied all values from Firebase Console

### Error: "auth/unauthorized-domain"
- Go to Firebase Console > Authentication > Settings > Authorized domains
- Add your GitHub Pages domain

## Production Checklist

- [ ] Firebase project created
- [ ] Email/Password authentication enabled
- [ ] Web app registered in Firebase
- [ ] firebase-config.js updated with credentials
- [ ] Authorized domains configured
- [ ] Code deployed to GitHub Pages
- [ ] Test account creation works
- [ ] Test login works
- [ ] Test logout works

## Support

For Firebase documentation: https://firebase.google.com/docs/auth
