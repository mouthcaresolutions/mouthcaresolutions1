import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-teal-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-3 mb-4">
              <img
                src="/mcs-logo.jpg"
                alt="Mouth Care Solutions"
                className="h-12 w-12 rounded-full object-cover border-2 border-teal-400"
              />
              <div>
                <h3 className="text-lg font-bold">Mouth Care Solutions</h3>
                <p className="text-teal-300 text-sm">Smile with us</p>
              </div>
            </Link>
            <p className="text-teal-200 text-sm leading-relaxed">
              Your trusted dental care partner in Vijayawada. We offer
              comprehensive dental treatments with modern technology and a
              compassionate approach.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-teal-300 uppercase tracking-wider text-sm mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: "Home", href: "/" },
                { label: "About Us", href: "/about" },
                { label: "Our Doctors", href: "/doctors" },
                { label: "Services", href: "/services" },
                { label: "Blog", href: "/blog" },
                { label: "Contact Us", href: "/contact" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-teal-200 hover:text-white text-sm transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-teal-300 uppercase tracking-wider text-sm mb-4">
              Our Services
            </h4>
            <ul className="space-y-2.5 text-sm text-teal-200">
              <li><Link href="/services" className="hover:text-white transition-colors">Root Canal Treatment</Link></li>
              <li><Link href="/services" className="hover:text-white transition-colors">Dental Implants</Link></li>
              <li><Link href="/services" className="hover:text-white transition-colors">Teeth Whitening</Link></li>
              <li><Link href="/services" className="hover:text-white transition-colors">Braces & Aligners</Link></li>
              <li><Link href="/services" className="hover:text-white transition-colors">Cosmetic Dentistry</Link></li>
              <li><Link href="/services" className="hover:text-white transition-colors">Pediatric Dentistry</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-teal-300 uppercase tracking-wider text-sm mb-4">
              Contact Info
            </h4>
            <div className="space-y-3 text-sm text-teal-200">
              <p>
                <strong className="text-white">Address:</strong>
                <br />
                Door No. 29-28-23, Bhavani Complex, Suryaraopeta, Vijayawada,
                Andhra Pradesh 520002
              </p>
              <p>
                <strong className="text-white">Phone:</strong>
                <br />
                <a href="tel:+919866344866" className="hover:text-white transition-colors">
                  +91 98663 44866
                </a>
              </p>
              <p>
                <strong className="text-white">Email:</strong>
                <br />
                <a
                  href="mailto:mouthcaresolutions@gmail.com"
                  className="hover:text-white transition-colors"
                >
                  mouthcaresolutions@gmail.com
                </a>
              </p>
              <p>
                <strong className="text-white">Hours:</strong>
                <br />
                Mon – Sat: 10:00 AM – 8:00 PM
                <br />
                Sunday: Closed
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-teal-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-teal-300">
          <p>
            &copy; {new Date().getFullYear()} Mouth Care Solutions | Door No.
            29-28-23, Bhavani Complex, Suryaraopeta, Vijayawada, Andhra Pradesh
            520002
          </p>
          <p>
            Call: <a href="tel:+919866344866" className="hover:text-white">+91 98663 44866</a> | Email: {" "}
            <a href="mailto:mouthcaresolutions@gmail.com" className="hover:text-white">
              mouthcaresolutions@gmail.com
            </a>{" "}
            | Open Mon–Sat 10AM–8PM
          </p>
        </div>
      </div>
    </footer>
  );
}