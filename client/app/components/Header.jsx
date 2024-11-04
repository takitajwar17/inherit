// Add this directive to make Header a Client Component
"use client";

import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

// Import the logo image
import KolabLogo from "../../public/kolab-logo-white-w-icon.png";

const Header = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-20 flex items-center justify-between px-8 py-4 bg-black">
      {/* Logo Section */}
      <div className="flex items-center">
        <Link href="/">
          <Image src={KolabLogo} alt="Kolab Logo" width={96} />
        </Link>
      </div>

      {/* Optional: Add navigation links or user-related buttons */}
      <div className="flex items-center space-x-4">
        {/* Example: User Button */}
        <UserButton />
      </div>
    </nav>
  );
};

export default Header;
