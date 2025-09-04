import { Link } from "wouter";
import { Home, Building2, Users, Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white border-t border-gray-800" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Home className="text-white text-lg" />
              </div>
              <span className="text-xl font-bold">EstateAI</span>
            </div>
            <p className="text-gray-400 text-sm">
              AI-powered real estate platform helping you find your perfect home in Kurdistan and Iraq.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  href="/" 
                  className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2"
                  data-testid="footer-home-link"
                >
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/properties" 
                  className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2"
                  data-testid="footer-properties-link"
                >
                  <Building2 className="h-4 w-4" />
                  <span>Properties</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/agent-dashboard" 
                  className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2"
                  data-testid="footer-agents-link"
                >
                  <Users className="h-4 w-4" />
                  <span>Agent Dashboard</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Property Types */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Property Types</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="hover:text-white transition-colors cursor-pointer">Houses</li>
              <li className="hover:text-white transition-colors cursor-pointer">Apartments</li>
              <li className="hover:text-white transition-colors cursor-pointer">Villas</li>
              <li className="hover:text-white transition-colors cursor-pointer">Commercial Land</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2 text-gray-400">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>Erbil, Kurdistan Region, Iraq</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>+964 750 123 4567</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>info@estateai.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright Row */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-sm text-gray-400">
            © 2025 EstateAI. All rights reserved. Powered by AI technology.
          </p>
        </div>
      </div>
    </footer>
  );
}