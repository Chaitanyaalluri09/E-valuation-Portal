import React from 'react';
import logo from '../../assets/images/logo.png'; // Correct relative path

const Header = () => {
  return (
    <header className="w-full bg-white shadow-sm">
      <div className="w-full px-4 py-2 flex items-center justify-center">
        <div className="ml-8">
          <img 
            src={logo} 
            alt="Logo"
            className="h-16 w-auto" // reduced from likely previous larger size
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
