import Link from "next/link"
import { GraduationCap, BookOpen, Compass, BarChart, Mail, MapPin, Youtube } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-[#002B5B] text-white py-16 font-['Inter']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <GraduationCap className="h-8 w-8 text-[#FFBB00]" />
              <span className="text-xl font-bold">StudyHike</span>
            </div>
            <p className="text-white/70">Guiding JEE/NEET aspirants to academic excellence with personalized mentorship and proven study strategies.</p>
            <div className="mt-6 space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-[#FFBB00] mt-0.5" />
                <p className="text-white/70">Kurnool, Andhra Pradesh</p>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-[#FFBB00]" />
                <p className="text-white/70">info247studyhike@email.com</p>
              </div>
            </div>
            
            <div className="mt-6">
              <a href="#" className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors">
                <Youtube className="h-5 w-5 text-[#FFBB00]" />
                <span>YouTube Channel</span>
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-6 text-[#FFBB00]">Quick Links</h3>
            <ul className="space-y-3 text-white/70">
              <li>
                <Link href="/features" className="hover:text-white flex items-center transition-colors">
                  <Compass className="h-4 w-4 mr-2 text-[#FFBB00]" />
                  Features
                </Link>
              </li>
              <li>
                <Link href="/resources" className="hover:text-white flex items-center transition-colors">
                  <BookOpen className="h-4 w-4 mr-2 text-[#FFBB00]" />
                  Resources
                </Link>
              </li>
              <li>
                <Link href="/testimonials" className="hover:text-white flex items-center transition-colors">
                  <BarChart className="h-4 w-4 mr-2 text-[#FFBB00]" />
                  Success Stories
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-6 text-[#FFBB00]">Support</h3>
            <ul className="space-y-3 text-white/70">
              <li>
                <Link href="/help" className="hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-6 text-[#FFBB00]">Legal</h3>
            <ul className="space-y-3 text-white/70">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
            
            <div className="mt-8 p-4 bg-white/10 rounded-lg">
              <p className="text-sm text-white/80 font-medium">
                "Founded by a student. Made for students."
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 text-center text-white/60">
          <p>&copy; {new Date().getFullYear()} StudyHike. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
