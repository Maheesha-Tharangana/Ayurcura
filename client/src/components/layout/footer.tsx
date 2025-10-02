import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-neutral-800 text-white pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1 - Logo and Socials */}
          <div>
            <div className="flex items-center mb-6">
              <i className="ri-plant-line text-primary-400 text-2xl mr-2"></i>
              <span className="ayurcura-logo text-white text-xl">AyurCura</span>
            </div>
            <p className="text-neutral-400 text-sm">
              Connecting traditional Ayurvedic wisdom with modern healthcare needs through technology.
            </p>
            <div className="mt-6 flex space-x-4">
              <a href="#" className="text-neutral-400 hover:text-white">
                <i className="ri-facebook-fill text-xl"></i>
              </a>
              <a href="#" className="text-neutral-400 hover:text-white">
                <i className="ri-twitter-fill text-xl"></i>
              </a>
              <a href="#" className="text-neutral-400 hover:text-white">
                <i className="ri-instagram-line text-xl"></i>
              </a>
              <a href="#" className="text-neutral-400 hover:text-white">
                <i className="ri-linkedin-fill text-xl"></i>
              </a>
            </div>
          </div>

          {/* Column 2 - Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-6">Quick Links</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/">
                  <span className="text-neutral-400 hover:text-white cursor-pointer">Home</span>
                </Link>
              </li>
              <li>
                <Link href="/doctors">
                  <span className="text-neutral-400 hover:text-white cursor-pointer">Find Doctors</span>
                </Link>
              </li>
              <li>
                <Link href="/treatments">
                  <span className="text-neutral-400 hover:text-white cursor-pointer">Treatments</span>
                </Link>
              </li>
              <li>
                <Link href="/articles">
                  <span className="text-neutral-400 hover:text-white cursor-pointer">Health Articles</span>
                </Link>
              </li> 
             
            </ul>
          </div>

          {/* Column 3 - Resources */}
          <div>
            <h3 className="text-lg font-bold mb-6">Resources</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/articles">
                  <span className="text-neutral-400 hover:text-white cursor-pointer">Ayurvedic Dictionary</span>
                </Link>
              </li>
              <li>
                <Link href="/treatments">
                  <span className="text-neutral-400 hover:text-white cursor-pointer">Treatment Guide</span>
                </Link>
              </li>
              <li>
                <a href="#" className="text-neutral-400 hover:text-white">FAQ</a>
              </li>
              <li>
                <a href="#" className="text-neutral-400 hover:text-white">Privacy Policy</a>
              </li>
              <li>
                <a href="#" className="text-neutral-400 hover:text-white">Terms of Service</a>
              </li>
            </ul>
          </div>

          {/* Column 4 - Contact */}
          <div>
            <h3 className="text-lg font-bold mb-6">Contact Us</h3>
            <ul className="space-y-4 text-neutral-400">
              <li className="flex items-start">
                <i className="ri-map-pin-line text-xl mr-3 mt-0.5"></i>
                <span>No 2/24 Ayurcura Way, Colombo, Sri Lanka</span>
              </li>
              <li className="flex items-center">
                <i className="ri-phone-line text-xl mr-3"></i>
                <span>+94 11 456 7890</span>
              </li>
              <li className="flex items-center">
                <i className="ri-mail-line text-xl mr-3"></i>
                <span>info@ayurcura.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-neutral-700 text-center text-neutral-400 text-sm">
          <p>&copy; {new Date().getFullYear()} AyurCura. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
