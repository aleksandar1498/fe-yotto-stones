"use client";
import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";

const materials = [
  { name: "Marble", image: "/images/marble.jpg" },
  { name: "Granite", image: "/images/granite.jpg" },
  { name: "Quartz", image: "/images/quartz.jpg" },
  { name: "Onyx", image: "/images/onyx.jpg" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  function toggleDropdown(){
    setDropdownOpen((lastStatus) => !lastStatus );
  }

  return (
    <nav className="bg-gray-900 text-white fixed w-screen top-0 z-50">
      <div className="container mx-auto flex items-center justify-between py-4 px-6">
      <div className="text-2xl font-bold">
          <a href="#">LOGO</a>
        </div>
        {/* CTA Button (Left) */}
       
        {/* Centered Links */}
        <div className="hidden lg:flex space-x-8">
          <a href="#" className="hover:text-gray-400">Home</a>
          <a href="#" className="hover:text-gray-400">About</a>
          <div 
                
            onClick={() => toggleDropdown()}
            // onMouseLeave={() => setDropdownOpen(false)}
          >
            <button className="flex items-center space-x-1">
              <span>Materials</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {dropdownOpen && (
              <div className="absolute left-0 top-full w-screen bg-gray-800 p-6 shadow-lg flex">
                {materials.map((material) => (
                  <div key={material.name} className="w-1/4 text-center">
                    <img src={material.image} className="w-full h-24 object-cover rounded-lg mb-2" />
                    <p>{material.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <a href="#" className="hover:text-gray-400">Projects</a>
          <a href="#" className="hover:text-gray-400">Contact</a>
        </div>

        {/* Logo (Right) */}
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg hidden lg:block">
          Get a Quote
        </button>


        {/* Mobile Menu Button */}
        <button className="lg:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {isOpen && (
        <div className="lg:hidden bg-gray-800 p-4">
          <a href="#" className="block py-2">Home</a>
          <a href="#" className="block py-2">About</a>
          <div className="py-2">
            <button className="flex items-center w-full justify-between" onClick={() => setDropdownOpen(!dropdownOpen)}>
              <span>Materials</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {dropdownOpen && (
              <div className="mt-2">
                {materials.map((material) => (
                  <p key={material.name} className="py-1 text-gray-300">{material.name}</p>
                ))}
              </div>
            )}
          </div>
          <a href="#" className="block py-2">Projects</a>
          <a href="#" className="block py-2">Contact</a>
          <button className="w-full bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded-lg mt-4">
            Get a Quote
          </button>
        </div>
      )}
    </nav>
  );
}