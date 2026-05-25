 # LYNQ Chat App 📱

A modern, real-time chat application built with React Native, Expo, and Socket.io. Features 1-on-1 messaging with WhatsApp-style UI and real-time communication.

## 🚀 Features

- **Real-time Messaging**: 1-on-1 chat with instant message delivery
- **Socket.io Integration**: Real-time WebSocket communication
- **Cross-platform**: Works on iOS, Android, and Web
- **Simple Backend**: Express server with in-memory message storage
- **User Switching**: Test messaging from different user perspectives

## 📋 Prerequisites

Before running this app, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Git](https://git-scm.com/)

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Tayanithaa/Lynq-chat-app.git
cd Lynq-chat-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# API Configuration
EXPO_PUBLIC_API_BASE_URL=http://localhost:3004
EXPO_PUBLIC_SOCKET_URL=http://localhost:3004
```

## 🚀 Running the Application

### Start the Backend Server

```bash
node simple-server.js
```

The backend server will start on `http://localhost:3004`

### Start the Frontend App

```bash
npx expo start --port 8082
```

This will start the Expo development server. You can then:

- Press `w` to open in web browser
- Press `a` to open Android emulator
- Press `i` to open iOS simulator
- Scan QR code with Expo Go app on your phone

## 📱 App Structure

```
lynq-chat/
├── app/                    # App screens and navigation
│   ├── index.tsx          # Main entry point
│   ├── _layout.tsx        # Auth provider layout
│   ├── front.tsx          # Main app with tabs
│   ├── chatscreen.tsx     # Chat list screen
│   ├── chat/              # Individual chat screens
│   │   └── [chatId].tsx   # 1-on-1 chat interface
│   ├── hooks/             # Custom React hooks
│   │   └── useMessages.ts # Real-time messaging hook
│   ├── services/          # API services
│   │   └── apiService.ts  # Message API calls
│   └── utils/             # Utilities
│       └── socketConfig.ts# Socket.io configuration
├── simple-server.js       # Express + Socket.io server
├── components/            # Reusable UI components
├── assets/                # Images and fonts
└── README.md
```

## 🔧 Available Scripts

### Frontend
- `npx expo start --port 8082` - Start Expo development server
- `npx expo start --web` - Start on web browser
- `npx expo start --android` - Start on Android
- `npx expo start --ios` - Start on iOS

### Backend
- `node simple-server.js` - Start the Socket.io server

## 📚 Key Technologies

- **Frontend**: React Native, Expo, TypeScript
- **UI**: React Native Components, Material Top Tabs
- **Real-time Communication**: Socket.io WebSockets
- **Backend**: Node.js, Express.js, Socket.io
- **Navigation**: Expo Router
- **State Management**: React Hooks (useState, useEffect)

## 🎨 UI Features

- **WhatsApp-style Messages**: Right-aligned (sent), left-aligned (received)
- **Real-time Updates**: Messages appear instantly via WebSockets
- **Clean Design**: Simple, modern chat interface
- **User Switching**: Test different user perspectives
- **Tab Navigation**: Material Top Tabs for different sections

## � Chat Features

1. **1-on-1 Messaging**: Simple Person 1 ↔ Person 2 chat
2. **Real-time Delivery**: Instant message sending/receiving
3. **Message History**: Persistent message storage
4. **User Identification**: Automatic user assignment
5. **WhatsApp-style UI**: Familiar chat interface

## 🗄️ Data Storage

### In-Memory Storage (Simple Server)
```javascript
// Messages stored temporarily in server memory
{
  id: String,
  text: String,
  senderId: String,
  receiverId: String,
  timestamp: String
}
```

##  Troubleshooting

### Common Issues

1. **Backend Connection Error**
   - Ensure `simple-server.js` is running on port 3004
   - Check if port 3004 is available: `netstat -ano | findstr :3004`

2. **Socket.io Connection Issues**
   - Verify EXPO_PUBLIC_SOCKET_URL in .env file
   - Check browser console for WebSocket errors

3. **localStorage Error on Mobile** ⚠️ **FIXED**
   - **Error**: `Property 'localStorage' doesn't exist`
   - **Solution**: Updated to use cross-platform storage utility
   - **Files Modified**: `app/utils/storage.ts`, `app/hooks/useMessages.ts`
   - Uses AsyncStorage for mobile and localStorage for web

4. **Expo Metro Bundler Issues**
   ```bash
   npx expo start --clear --port 8082
   ```

5. **Messages Not Appearing**
   - Check backend server logs
   - Verify Socket.io connection in browser dev tools
   - Try refreshing the page

### Development Tips

- Use browser dev tools to monitor WebSocket connections
- Check server logs for Socket.io events
- Test with multiple browser tabs to simulate different users
- Use the "Switch User" button to test message alignment

##  How to Test

1. **Start Both Servers**:
   ```bash
   # Terminal 1: Backend
   node simple-server.js
   
   # Terminal 2: Frontend
   npx expo start --port 8082
   ```

2. **Open in Browser**: Navigate to `http://localhost:8082`

3. **Test Messaging**:
   - Go to "Chats" tab → Click "Person 2"
   - Send a message (appears on right in green)
   - Click "Switch User" to become the other person
   - Send another message (appears on right for current user)
   - Switch back to see the conversation from original perspective

4. **Test Real-time**: Open multiple browser tabs to see instant message delivery

## 🔮 Future Enhancements

### � Planned Features
- **Multi-user Support**: Group chat functionality
- **Message Persistence**: Database storage for message history
- **User Authentication**: Login/signup system
- **File Sharing**: Send images and documents
- **Message Status**: Delivery and read receipts
- **Push Notifications**: Real-time notifications

### � Advanced Features (Future Vision)
- **End-to-End Encryption**: Secure message encryption
- **Auto-Link Verification**: Scan for malicious links
- **Smart Features**: Translation, word lookup
- **Content Filtering**: AI-powered safety features

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team
- **Tayanithaa N S** - *Team Member*
- **Mirdula R** - *Team Member*
- **Piriyadharshini L K** - *Team Member*
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


