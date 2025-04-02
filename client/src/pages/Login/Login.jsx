// src/pages/Login/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
import Header from '../../components/Header/Header';
import FirstLoginModal from '../../components/FirstLoginModal';
import ForgotPasswordModal from '../../components/ForgotPasswordModal';

const LoginPage = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState('evaluator');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showFirstLoginModal, setShowFirstLoginModal] = useState(false);
  const [userId, setUserId] = useState(null);
  const [loginResponse, setLoginResponse] = useState(null);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  const handleLogin = () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setIsLoading(true);
    
    // Use XMLHttpRequest instead of axios to avoid any potential issues
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${axiosInstance.defaults.baseURL}/api/auth/login`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    xhr.onload = function() {
      setIsLoading(false);
      
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText);
        setLoginResponse({ data: response });
        
        localStorage.setItem('token', response.token);
        localStorage.setItem('userRole', response.user.role);
        
        if (response.user.isFirstLogin && response.user.role === 'evaluator') {
          setUserId(response.user.id);
          setShowFirstLoginModal(true);
        } else {
          if (response.user.role === 'admin') {
            navigate('/admin/dashboard');
          } else {
            navigate('/evaluator/dashboard');
          }
        }
      } else {
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          setError(errorResponse.message || 'Login failed. Please try again.');
        } catch (e) {
          setError('Login failed. Please try again.');
        }
      }
    };
    
    xhr.onerror = function() {
      setIsLoading(false);
      setError('Network error. Please try again.');
    };
    
    xhr.send(JSON.stringify({
      email,
      password,
      userType
    }));
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handlePasswordInputChange = (e) => {
    setPassword(e.target.value);
  };

  const handlePasswordChange = () => {
    setShowFirstLoginModal(false);
    localStorage.setItem('token', loginResponse.data.token);
    localStorage.setItem('userRole', 'evaluator');
    navigate('/evaluator/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <div className="px-1 sm:px-4">
        <div className="w-[85%] sm:max-w-sm mx-auto mt-4 sm:mt-10 p-3 sm:p-6 bg-white rounded-lg sm:rounded-xl shadow-md sm:shadow-lg">
          {error && (
            <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-red-100 text-red-700 rounded text-xs sm:text-sm">
              {error}
            </div>
          )}

          <div className="flex mb-4 sm:mb-6 bg-gray-100 rounded p-1 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              className={`flex-1 py-2 px-2 rounded-md flex items-center justify-center gap-1 transition-colors duration-200 ${
                userType === 'evaluator'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setUserType('evaluator')}
            >
              <svg 
                className="w-4 h-4"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                />
              </svg>
              <span className="text-sm">Evaluator</span>
            </button>
            <button
              type="button"
              className={`flex-1 py-2 px-2 rounded-md flex items-center justify-center gap-1 transition-colors duration-200 ${
                userType === 'admin'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setUserType('admin')}
            >
              <svg 
                className="w-4 h-4"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" 
                />
              </svg>
              <span className="text-sm">Admin</span>
            </button>
          </div>

          <div className="space-y-4 sm:space-y-5">
            <div>
              <label 
                htmlFor="email"
                className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={handleEmailChange}
                className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-sm"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={handlePasswordInputChange}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={(e) => {
                    if (!e.relatedTarget) {
                      setIsPasswordFocused(false);
                    }
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  placeholder="Enter your password"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleLogin();
                    }
                  }}
                />
                {isPasswordFocused && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
              <div className="mt-1 text-right">
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(true)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors duration-200 flex items-center justify-center disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </div>
        </div>
      </div>

      {showFirstLoginModal && (
        <FirstLoginModal 
          userId={userId} 
          onPasswordChange={handlePasswordChange} 
        />
      )}

      {showForgotPasswordModal && (
        <ForgotPasswordModal
          onClose={() => setShowForgotPasswordModal(false)}
          userType={userType}
        />
      )}
    </div>
  );
};

export default LoginPage;
