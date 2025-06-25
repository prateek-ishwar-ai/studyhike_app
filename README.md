# 🎓 StudyHike - Mobile-First Learning Platform

A comprehensive, mobile-optimized learning platform designed specifically for **JEE/NEET aspirants** and competitive exam preparation. Built with **Next.js**, **React**, **Supabase**, and **Capacitor** for native mobile app experience.

![StudyHike Banner](https://via.placeholder.com/800x400/0C0E19/FACC15?text=StudyHike+-+Your+Study+Companion)

## ✨ Features

### 🔥 **Mobile-First Experience**
- **Native Android App** built with Capacitor
- **Mobile-optimized UI/UX** with touch-friendly interactions
- **Offline-ready** progressive web app capabilities
- **App-like navigation** with bottom tabs and gestures

### 📚 **For Students**
- **Personalized Study Plans** tailored to JEE/NEET syllabus
- **Progress Tracking** with detailed analytics
- **Interactive Study Timer** with break management
- **Homework Management** with file upload/download
- **Mock Tests** and performance analysis
- **Mentor Matching** and 1-on-1 sessions
- **Study Streak** gamification

### 👨‍🏫 **For Mentors**
- **Student Management** dashboard
- **Session Scheduling** and video calls
- **Homework Assignment** and review
- **Progress Monitoring** of assigned students
- **Resource Sharing** and materials upload
- **Meeting Request Management**

### 🔐 **Authentication & Security**
- **Magic Link Login** (no password needed)
- **Password-based Login** option
- **Role-based Access Control** (Student/Mentor/Admin)
- **Mobile App Deep Linking** for magic links

### 📱 **Mobile App Features**
- **Push Notifications** for important updates
- **Biometric Authentication** support
- **Status Bar Integration**
- **Native UI Components**
- **Quick Actions** floating button

## 🚀 **Live Demo**

- **Website**: [https://studyhike.in](https://studyhike.in)
- **Mobile App**: Download from GitHub Releases

## 📱 **Mobile App Setup**

### Prerequisites
- Node.js 18+ and npm/pnpm
- Android Studio (for Android development)
- Xcode (for iOS development - macOS only)

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/studyhike.git
cd studyhike
pnpm install
```

### 2. Environment Setup
Create `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_APP_URL=https://studyhike.in
```

### 3. Build Web App
```bash
pnpm build
```

### 4. Generate Mobile App
```bash
# Sync with Capacitor
npx cap sync android

# Open in Android Studio
npx cap open android
```

### 5. Build APK
In Android Studio:
1. **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Find APK at: `android/app/build/outputs/apk/debug/app-debug.apk`

## 🛠️ **Tech Stack**

### **Frontend**
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Lucide Icons** - Beautiful iconography

### **Backend & Database**
- **Supabase** - PostgreSQL database with realtime
- **Row Level Security** - Database-level permissions
- **Edge Functions** - Serverless API endpoints
- **Storage** - File upload/download with CDN

### **Mobile Development**
- **Capacitor** - Native mobile app wrapper
- **PWA** - Progressive Web App capabilities
- **Android Studio** - Native Android development

### **Authentication**
- **Supabase Auth** - Magic links and password auth
- **JWT Tokens** - Secure session management
- **Role-based Access** - Student/Mentor/Admin roles

### **Deployment**
- **Vercel** - Web app hosting
- **Supabase** - Database and backend hosting
- **GitHub Actions** - CI/CD pipeline

## 🏗️ **Project Structure**

```
studyhike/
├── app/                     # Next.js App Router
│   ├── auth/               # Authentication pages
│   ├── student/            # Student dashboard & features
│   ├── mentor/             # Mentor dashboard & features
│   ├── admin/              # Admin panel
│   └── api/                # API routes
├── components/             # Reusable UI components
│   ├── ui/                # Base UI components
│   ├── layout/            # Layout components
│   └── dashboard/         # Dashboard-specific components
├── contexts/              # React contexts
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
│   ├── supabase/         # Database utilities
│   └── utils/            # Helper functions
├── types/                 # TypeScript definitions
├── android/              # Capacitor Android app
├── ios/                  # Capacitor iOS app
└── supabase/             # Database migrations & functions
```

## 📊 **Database Schema**

### Core Tables
- **users** - User authentication data
- **students** - Student profiles and progress
- **mentors** - Mentor profiles and specializations
- **study_plans** - Personalized study schedules
- **homework** - Assignment tracking
- **meeting_requests** - Mentor session bookings
- **tests** - Mock test results
- **resources** - Study materials and uploads

## 🔧 **Development**

### Run Locally
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open http://localhost:3000
```

### Database Setup
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### Mobile Development
```bash
# Build for production
pnpm build

# Sync with Capacitor
npx cap sync

# Run on Android
npx cap run android

# Run on iOS
npx cap run ios
```

## 🚀 **Deployment**

### Web App (Vercel)
1. Connect GitHub repository to Vercel
2. Set environment variables
3. Deploy automatically on push

### Mobile App
1. Build APK in Android Studio
2. Test on device
3. Publish to Google Play Store

## 🤝 **Contributing**

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow **TypeScript** best practices
- Use **Tailwind CSS** for styling
- Write **responsive** mobile-first code
- Test on **mobile devices**
- Follow **React** component patterns

## 📝 **License**

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Supabase** for the amazing backend-as-a-service
- **Vercel** for seamless deployment
- **Capacitor** for mobile app capabilities
- **Next.js** team for the excellent framework

## 📞 **Support**

- **Email**: support@studyhike.in
- **GitHub Issues**: [Create an Issue](https://github.com/yourusername/studyhike/issues)
- **Documentation**: [Wiki](https://github.com/yourusername/studyhike/wiki)

---

**Made with ❤️ for JEE/NEET aspirants** 

Transform your study journey with StudyHike! 🚀
