import React from "react"

export default function PureStaticHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="h-8 w-8 text-blue-400"
            >
              <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/>
              <path d="M22 10v6"/>
              <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>
            </svg>
            <span className="text-2xl font-bold text-white">StudyHike</span>
          </div>
          <div className="hidden md:flex space-x-6">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
            <a href="#journey" className="text-gray-300 hover:text-white transition-colors">Journey</a>
            <a href="#plans" className="text-gray-300 hover:text-white transition-colors">Plans</a>
            <a href="#stories" className="text-gray-300 hover:text-white transition-colors">Stories</a>
          </div>
          <a href="/auth/login/">
            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border bg-background h-10 px-4 py-2 text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-white">
              Login
            </button>
          </a>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Your JEE Journey Starts With the{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
              Right Guidance
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            StudyHike is your companion through JEE's struggle — helping you stay calm, stay focused, and move with purpose.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/auth/signup/">
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-11 rounded-md bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                Start Your Journey
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 h-5 w-5">
                  <path d="M5 12h14"/>
                  <path d="m12 5 7 7-7 7"/>
                </svg>
              </button>
            </a>
            <a href="#plans">
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border bg-background hover:text-accent-foreground h-11 rounded-md border-gray-400 text-gray-300 hover:bg-gray-800 px-8 py-3">
                View Plans
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Why Choose StudyHike?</h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Transform your academic chaos into focused success with our expert mentorship and proven strategies.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Feature 1 */}
          <div className="rounded-lg border text-card-foreground shadow-sm bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-blue-400">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="6"/>
                  <circle cx="12" cy="12" r="2"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Personal Mentorship</h3>
              <p className="text-gray-400 text-sm">1-on-1 guidance from JEE toppers</p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="rounded-lg border text-card-foreground shadow-sm bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-purple-400">
                  <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
                  <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
                  <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>
                  <path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/>
                  <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/>
                  <path d="M3.477 10.896a4 4 0 0 1 .585-.396"/>
                  <path d="M19.938 10.5a4 4 0 0 1 .585.396"/>
                  <path d="M6 18a4 4 0 0 1-1.967-.516"/>
                  <path d="M19.967 17.484A4 4 0 0 1 18 18"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Smart Study Plans</h3>
              <p className="text-gray-400 text-sm">AI-powered personalized learning paths</p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="rounded-lg border text-card-foreground shadow-sm bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-green-400">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Progress Tracking</h3>
              <p className="text-gray-400 text-sm">Real-time performance analytics</p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="rounded-lg border text-card-foreground shadow-sm bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-orange-400">
                  <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/>
                  <circle cx="12" cy="8" r="6"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Expert Support</h3>
              <p className="text-gray-400 text-sm">24/7 guidance from experienced mentors</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Transform Your JEE Journey?</h2>
          <p className="text-gray-300 text-lg mb-8">
            Join thousands of students who have already started their transformation with StudyHike
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/auth/signup/">
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-11 rounded-md bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                Start Free Trial
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 h-5 w-5">
                  <path d="M5 12h14"/>
                  <path d="m12 5 7 7-7 7"/>
                </svg>
              </button>
            </a>
            <a href="/auth/login/">
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border bg-background hover:text-accent-foreground h-11 rounded-md border-gray-400 text-gray-300 hover:bg-gray-800 px-8 py-3">
                Sign In
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-blue-400">
                  <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/>
                  <path d="M22 10v6"/>
                  <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>
                </svg>
                <span className="text-xl font-bold text-white">StudyHike</span>
              </div>
              <p className="text-gray-400 text-sm">Clarity Over Chaos. Calm Over Pressure.</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3">Product</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#plans" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#stories" className="hover:text-white transition-colors">Success Stories</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3">Company</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3">Legal</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">© 2024 StudyHike. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}