# LYNQ Chat App 📱

A modern, real-time chat application built with React Native, Expo, and Firebase. Features user authentication, real-time messaging, and a beautiful gradient UI.

## 🚀 Features

- **User Authentication**: Email/Password and Phone number authentication
- **Real-time Messaging**: Chat with other users in real-time
- **OTP Verification**: Secure phone number verification with OTP
- **Beautiful UI**: Modern gradient design with smooth animations
- **Cross-platform**: Works on iOS, Android, and Web
- **Firebase Integration**: Secure backend with Firebase Auth and Firestore
- **MongoDB Backend**: Node.js/Express backend with MongoDB for user data

## 📋 Prerequisites

Before running this app, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [MongoDB](https://www.mongodb.com/try/download/community) (for backend)
- [Git](https://git-scm.com/)

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Tayanithaa/Lynq-chat-app.git
cd Lynq-chat-app/basic-rn
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

### 4. Environment Configuration

#### Frontend (.env)
Create a `.env` file in the root directory:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

#### Backend (backend/.env)
Create a `.env` file in the backend directory:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/chatapp-backend

# Server Configuration
PORT=5000

# Environment
NODE_ENV=development
```

### 5. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable Authentication (Email/Password and Phone)
4. Enable Firestore Database
5. Copy your config values to the `.env` file

### 6. MongoDB Setup

1. Install MongoDB Community Edition
2. Start MongoDB service:
   ```bash
   # Windows
   net start MongoDB
   
   # macOS
   brew services start mongodb/brew/mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

## 🚀 Running the Application

### Start the Backend Server

```bash
cd backend
npm start
# or for development with auto-reload
npm run dev
```

The backend server will start on `http://localhost:5000`

### Start the Frontend App

```bash
# In the root directory (basic-rn)
npx expo start
```

This will start the Expo development server. You can then:

- Press `w` to open in web browser
- Press `a` to open Android emulator
- Press `i` to open iOS simulator
- Scan QR code with Expo Go app on your phone

## 📱 App Structure

```
basic-rn/
├── app/                    # App screens and navigation
│   ├── index.tsx          # Welcome screen
│   ├── login.tsx          # Email login screen
│   ├── loginpage.tsx      # Phone login screen
│   ├── otp.tsx            # OTP verification
│   ├── Account-setup.tsx  # User registration
│   ├── front.tsx          # Main app with tabs
│   ├── chatscreen.tsx     # Chat list screen
│   ├── chat/              # Individual chat screens
│   └── config/            # Firebase configuration
├── backend/               # Node.js backend
│   ├── server.js          # Express server
│   ├── models/            # MongoDB models
│   └── routes/            # API routes
├── components/            # Reusable UI components
├── assets/                # Images and fonts
└── README.md
```

## 🔧 Available Scripts

### Frontend
- `npm start` - Start Expo development server
- `npm run android` - Start on Android
- `npm run ios` - Start on iOS
- `npm run web` - Start on web
- `npm run lint` - Run ESLint

### Backend
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

## 📚 Key Technologies

- **Frontend**: React Native, Expo, TypeScript
- **UI**: NativeWind (Tailwind CSS), Linear Gradients
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore, MongoDB
- **Backend**: Node.js, Express.js, Mongoose
- **Navigation**: Expo Router, React Navigation

## 🎨 UI Features

- **Gradient Backgrounds**: Beautiful green-to-dark gradients
- **Modern Components**: Clean, iOS-style UI elements
- **Responsive Design**: Works on all screen sizes
- **Smooth Animations**: React Native Reanimated
- **Tab Navigation**: Material Top Tabs for main sections

## 🔐 Authentication Flow

1. **Welcome Screen**: App introduction with privacy policy
2. **Login Options**: Email/password or phone number
3. **OTP Verification**: For phone number authentication
4. **Registration**: New user account creation
5. **Main App**: Access to chat, updates, and calls

## 🗄️ Database Schema

### MongoDB (Users)
```javascript
{
  phone: String (unique),
  name: String,
  profileImage: String
}
```

### Firebase Firestore (Users)
```javascript
{
  name: String,
  mobile: String,
  email: String,
  password: String (hashed),
  createdAt: String
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Expo Doctor Errors**
   ```bash
   npx expo-doctor
   npx expo install --fix
   ```

2. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in backend/.env

3. **Firebase Authentication Issues**
   - Verify Firebase config in .env
   - Check Firebase console for enabled auth methods

4. **Metro Bundler Issues**
   ```bash
   npx expo start --clear
   ```

### Development Tips

- Use `npx expo-doctor` to check for common issues
- Run `npx expo install --fix` to update dependencies
- Check logs in Expo Dev Tools for detailed error information
- Use React Native Debugger for debugging

## 🔮 Future Features (Original Vision)

### 🔐 Advanced Security Features
- **End-to-End Encryption**: X25519 key exchange with ChaCha20-Poly1305
- **Auto-Link Verification**: Automatic scanning for malicious links
- **Forward Secrecy**: Enhanced message security

### 📡 Smart Features
- **Word Lookup**: In-chat dictionary functionality
- **Real-time Translation**: Automatic language translation
- **Auto-Block Unsafe Content**: AI-powered content filtering

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Mirdula R** - *Team Member*
- **Piriyadharshini L K** - *Team Member*
- **Tayanithaa N S** - *Team Member*
- **Logesh Raj B** - *Team Member*
- **Jaisurya S** - *Team Member*

## 🙏 Acknowledgments

- Expo team for the amazing development platform
- Firebase for backend services
- React Native community for excellent documentation
- All contributors who help improve this project

## 📞 Support

If you have any questions or need help, please:

1. Check the [Issues](https://github.com/Tayanithaa/Lynq-chat-app/issues) page
2. Create a new issue if your problem isn't already reported
3. Provide detailed information about your environment and the issue

---

**Happy Chatting with LYNQ! 🎉**


