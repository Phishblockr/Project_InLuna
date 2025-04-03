import React, { useEffect, useState } from 'react'
import { BiSolidDownArrow } from "react-icons/bi";

const DropDownDetails = ({emailDetails}) => {
    const [isOpen, setIsOpen] = useState(false);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (!event.target.closest(".gmail-dropdown")) {
          setIsOpen(false);
        }
      };
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }, []);
  
    return (
      <div className="relative gmail-dropdown inline-block">
        {/* Dropdown Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center text-gray-600 hover:text-gray-800 transition "
        >
          <BiSolidDownArrow className='text-[10px]'/>
        </button>
  
        {/* Dropdown Content */}
        {isOpen && (
          <div className="absolute left-0 mt-2 w-72 bg-white border border-gray-300 rounded-lg shadow-lg text-sm p-3 z-50">
            <div>
              <span className="font-semibold text-gray-700 text-right">From:</span>
              <span className="ml-2 text-gray-600">{emailDetails.from}</span>
            </div>
            <div >
              <span className="font-semibold text-gray-700">To:</span>
              <span className="ml-2 text-gray-600">{emailDetails.to}</span>
            </div>
            <div >
              <span className="font-semibold text-gray-700">Subject:</span>
              <span className="ml-2 text-gray-600">{emailDetails.subject}</span>
            </div>
            <div >
              <span className="font-semibold text-gray-700">Mailed by:</span>
              <span className="ml-2 text-gray-600">{emailDetails.mailedBy}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Signed by:</span>
              <span className="ml-2 text-gray-600">{emailDetails.signedBy}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Security:</span>
              <span className="ml-2 text-gray-600">{emailDetails.security}</span>
            </div>
          </div>
        )}
      </div>
    );
};

export default DropDownDetails