LYNQ-Chat-App
📱 LYNQ – A Privacy-First, Smart Messaging App LYNQ is an end-to-end encrypted, cross-platform messaging application built to redefine secure and intelligent communication. It combines cutting-edge cryptography, real-time communication, and AI-powered features to ensure not just privacy but also a smarter user experience. Designed for mobile platforms, LYNQ empowers users to communicate securely, lookup word meaning and verify shared content.

🚀 Project Status (As of August 15, 2025)
This project is currently in the initial setup phase. Here's a summary of what has been completed:
•	Project Initialization: A new React Native project has been created in the LYNQChatApp directory.
•	Firebase Integration:
o	The core Firebase dependencies (@react-native-firebase/app and @react-native-firebase/auth) have been added to the project.
o	The native Android project has been configured to connect with Firebase. The build.gradle files have been updated, and the google-services.json file has been added.
🚨 Current Blockers
The project is currently not buildable due to a local environment configuration issue.
1.	Android SDK Location: The build will fail until the local path to the Android SDK is correctly configured.
2.	Emulator/Device: An Android emulator must be running or a physical device must be connected to launch the application.

🛠️ Development Setup
Follow these steps to get the development environment up and running.
Prerequisites
•	Node.js
•	Java Development Kit (JDK)
•	Android Studio & Android SDK
1. Clone the Repository
git clone <repository-url>
cd LYNQ-Chat-App-main
2. Install Dependencies
Navigate to the React Native project directory and install the required npm packages.
cd LYNQChatApp
npm install
3. Configure Android SDK
This is a critical step to resolve the current build error.
1.	Create a new file named local.properties inside the LYNQChatApp/android directory.
2.	Open the local.properties file and add the following line, replacing path/to/your/android/sdk with the actual path to your Android SDK:
3.	sdk.dir=path/to/your/android/sdk
Example on Windows: sdk.dir=C:\Users\YourUsername\AppData\Local\Android\Sdk Example on macOS: sdk.dir=/Users/YourUsername/Library/Android/sdk
4. Run the Application
1.	Open Android Studio and start an Android emulator, or connect a physical Android device to your computer.
2.	Run the following command from the LYNQChatApp directory to build and launch the app:
npx react-native run-android

📝 Original App Concept
Features
🔐 Basic Features:
•	Real-Time Chat – Send and receive messages instantly with WebSockets.
•	End-to-End Encryption – All messages are protected using X25519 (Key Exchange), ChaCha20-Poly1305(AEAD) and Poly1305 (MAC).
•	User Authentication – Secure login and registration system using Firebase Auth.
•	Auto-Link Verification – Links shared in messages are automatically scanned for phishing or malicious content.
•	Media Sharing – Securely share images and files within chat.
•	Group Chats – Encrypted group chat support with synchronized messages.
📡 Advanced Features:
•	Auto-Blocks Unsafe Links – If a malicious link is detected, the link can be blocked until the user approves it.
•	Word Lookup - Lookup for word meanings within the chat itself.
•	Realtime Translation to English - Translate a message of a different language to english for understanding.
How It Works
•	User Signup/Login: Generates identity and encryption keys. Authenticates with backend using hashed credentials and Firebase.
•	Start a Conversation: Requests the receiver's pre-keys from the server. Uses E2EE to establish a secure session.
•	Send a Message: Message is encrypted on the client side. Optionally scanned for unsafe links. Sent to server and relayed to the receiver.
•	Receive Message: Decrypted locally using session keys.
Security Highlights
•	Uses X25519 (Key Exchange), ChaCha20-Poly1305(AEAD) and Poly1305 (MAC) for true end-to-end encryption.
•	All messages are encrypted before leaving the device.
•	No messages are stored in plaintext, even on the server.
•	Implements forward secrecy, ensuring past messages stay secure even if current keys are compromised.
•	Auto-blocks malicious messages until user approval based on threat detection APIs.
Supported Platforms
•	Mobile: Planned support via React Native

📂 Project Structure
The LYNQ-Chat-App project is organized for scalable, cross-platform mobile development. Below is an overview of the main files and folders:
LYNQChatApp/
├── android/                # Native Android project (Gradle, Java/Kotlin, resources)
│   └── app/
│       └── src/
│           └── main/
│               ├── java/com/lynqchatapp/   # MainActivity.kt, MainApplication.kt
│               └── res/                    # Drawables, mipmaps, values
├── ios/                    # Native iOS project (Swift, Storyboard, assets)
│   └── LYNQChatApp/
│       ├── AppDelegate.swift
│       ├── Images.xcassets/
│       ├── Info.plist
│       └── LaunchScreen.storyboard
├── src/                    # Application source code
│   ├── api/                # API integration
│   ├── assets/             # Static assets (images, fonts, etc.)
│   ├── components/         # Reusable UI components
│   ├── config/             # Configuration files
│   ├── features/           # Feature modules
│   │   ├── auth/           # Authentication logic
│   │   ├── chat/           # Chat functionality
│   │   ├── linkVerification/ # Link safety checks
│   │   ├── media/          # Media sharing
│   │   ├── translation/    # Message translation
│   │   └── wordLookup/     # Word meaning lookup
│   ├── navigation/         # Navigation setup
│   ├── screens/            # App screens
│   ├── services/           # Service layer (business logic)
│   └── utils/              # Utility functions
├── __tests__/              # Unit and integration tests
├── App.tsx                 # Main app entry point
├── index.js                # App bootstrap
├── package.json            # Project metadata and dependencies
├── README.md               # Project documentation
└── ...other config and build files
This structure ensures clear separation of concerns, maintainability, and ease of scaling for new features and platforms. Each feature is modularized under src/features, and platform-specific code is isolated in android/ and ios/ directories. Automated tests are placed in __tests__ to support robust development workflows.

🤝 Team
•	Mirdula R
•	Piriyadharshini L K
•	Tayanithaa N S
•	Logesh Raj B
•	Jaisurya S


