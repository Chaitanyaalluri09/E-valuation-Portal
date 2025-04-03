import { useState, useEffect } from 'react';
import { MdEdit, MdSave, MdClose, MdEmail } from 'react-icons/md';
import axiosInstance from '../utils/axiosConfig';
import Toast from './Toast';

function AccountSettings() {
  const [userProfile, setUserProfile] = useState({
    username: '',
    email: '',
    subjects: []
  });
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [editMode, setEditMode] = useState({
    username: false,
    email: false,
    password: false,
    subjects: false
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '', duration: 0 });
  const [loading, setLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [emailUpdateForm, setEmailUpdateForm] = useState({
    newEmail: '',
    otp: ''
  });
  const [showOTPInput, setShowOTPInput] = useState(false);

  useEffect(() => {
    fetchUserProfile();
    fetchAvailableSubjects();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await axiosInstance.get('/api/users/me');
      setUserProfile({
        username: response.data.username || '',
        email: response.data.email || '',
        subjects: response.data.subjects || []
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setToast({
        show: true,
        message: 'Failed to load user profile',
        type: 'error',
        duration: 3000
      });
      setLoading(false);
    }
  };

  const fetchAvailableSubjects = async () => {
    try {
      const response = await axiosInstance.get('/api/subjects/distinct/subjectName');
      setAvailableSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const handleSave = async (field) => {
    try {
      if (field === 'password') {
        if (password !== confirmPassword) {
          setToast({
            show: true,
            message: 'Passwords do not match',
            type: 'error',
            duration: 3000
          });
          return;
        }
        if (!password) {
          setEditMode({ ...editMode, password: false });
          return;
        }
      }

      const updateData = {
        [field]: field === 'password' ? password : userProfile[field]
      };

      await axiosInstance.put('/api/users/update-profile', updateData);
      
      setToast({
        show: true,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully`,
        type: 'success',
        duration: 2000
      });

      if (field === 'password') {
        setPassword('');
        setConfirmPassword('');
      }

      setEditMode({ ...editMode, [field]: false });
    } catch (error) {
      setToast({
        show: true,
        message: error.response?.data?.message || `Failed to update ${field}`,
        type: 'error',
        duration: 3000
      });
    }
  };

  const handlePasswordChange = async () => {
    try {
      const { currentPassword, newPassword, confirmPassword } = passwordForm;

      if (!currentPassword || !newPassword || !confirmPassword) {
        setToast({
          show: true,
          message: 'All password fields are required',
          type: 'error',
          duration: 3000
        });
        return;
      }

      if (newPassword !== confirmPassword) {
        setToast({
          show: true,
          message: 'New passwords do not match',
          type: 'error',
          duration: 3000
        });
        return;
      }

      await axiosInstance.put('/api/users/update-password', {
        currentPassword,
        newPassword
      });

      setToast({
        show: true,
        message: 'Password updated successfully',
        type: 'success',
        duration: 2000
      });

      // Reset form and hide it
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);

    } catch (error) {
      setToast({
        show: true,
        message: error.response?.data?.message || 'Failed to update password',
        type: 'error',
        duration: 3000
      });
    }
  };

  const handleEmailUpdate = async () => {
    try {
      if (!emailUpdateForm.newEmail) {
        setToast({
          show: true,
          message: 'Please enter a new email address',
          type: 'error',
          duration: 3000
        });
        return;
      }

      if (!showOTPInput) {
        // First step: Request OTP
        await axiosInstance.post('/api/users/request-email-update', {
          newEmail: emailUpdateForm.newEmail
        });
        
        setShowOTPInput(true);
        setToast({
          show: true,
          message: 'OTP has been sent to your new email address',
          type: 'success',
          duration: 2000
        });
      } else {
        // Second step: Verify OTP and update email
        if (!emailUpdateForm.otp) {
          setToast({
            show: true,
            message: 'Please enter the OTP',
            type: 'error',
            duration: 3000
          });
          return;
        }

        await axiosInstance.put('/api/users/verify-email-update', {
          otp: emailUpdateForm.otp
        });

        setToast({
          show: true,
          message: 'Email updated successfully',
          type: 'success',
          duration: 2000
        });

        // Update local state
        setUserProfile(prev => ({
          ...prev,
          email: emailUpdateForm.newEmail
        }));

        // Reset form
        setEmailUpdateForm({ newEmail: '', otp: '' });
        setShowOTPInput(false);
        setEditMode(prev => ({ ...prev, email: false }));
      }
    } catch (error) {
      setToast({
        show: true,
        message: error.response?.data?.message || 'Failed to update email',
        type: 'error',
        duration: 3000
      });
    }
  };

  const handleSubjectChange = (e) => {
    const selectedSubject = e.target.value;
    if (selectedSubject && !userProfile.subjects.includes(selectedSubject)) {
      setUserProfile({
        ...userProfile,
        subjects: [...userProfile.subjects, selectedSubject]
      });
    }
  };

  const closeToast = () => {
    setToast({ ...toast, show: false });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          duration={toast.duration}
          onClose={closeToast} 
        />
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
          <p className="text-gray-500 mt-1">Manage your account information and preferences</p>
        </div>

        <div className="p-8 space-y-8">
          {/* Username Section */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Username</h3>
                  <p className="text-sm text-gray-500">Your unique identifier on the platform</p>
                </div>
                <button
                  onClick={() => setEditMode({ ...editMode, username: !editMode.username })}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {editMode.username ? <MdClose className="text-xl" /> : <MdEdit className="text-xl" />}
                </button>
              </div>
            </div>
            <div className="px-6 py-4">
              {editMode.username ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userProfile.username}
                    onChange={(e) => setUserProfile({ ...userProfile, username: e.target.value })}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter username"
                  />
                  <button
                    onClick={() => handleSave('username')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <MdSave className="text-xl" />
                    Save
                  </button>
                </div>
              ) : (
                <p className="text-gray-900 text-lg">{userProfile.username}</p>
              )}
            </div>
          </div>

          {/* Email Section */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Email Address</h3>
                  <p className="text-sm text-gray-500">Your email for notifications and communication</p>
                </div>
                <button
                  onClick={() => {
                    setEditMode({ ...editMode, email: !editMode.email });
                    if (!editMode.email) {
                      setEmailUpdateForm({ newEmail: '', otp: '' });
                      setShowOTPInput(false);
                    }
                  }}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {editMode.email ? <MdClose className="text-xl" /> : <MdEdit className="text-xl" />}
                </button>
              </div>
            </div>
            <div className="px-6 py-4">
              {editMode.email ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={emailUpdateForm.newEmail}
                      onChange={(e) => setEmailUpdateForm({ ...emailUpdateForm, newEmail: e.target.value })}
                      placeholder="Enter new email"
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {!showOTPInput && (
                      <button
                        onClick={handleEmailUpdate}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <MdEmail className="text-xl" />
                        Send OTP
                      </button>
                    )}
                  </div>
                  {showOTPInput && (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={emailUpdateForm.otp}
                        onChange={(e) => setEmailUpdateForm({ ...emailUpdateForm, otp: e.target.value })}
                        placeholder="Enter OTP"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleEmailUpdate}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Verify & Update
                        </button>
                        <button
                          onClick={() => {
                            setShowOTPInput(false);
                            setEmailUpdateForm({ newEmail: '', otp: '' });
                          }}
                          className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-900 text-lg">{userProfile.email}</p>
              )}
            </div>
          </div>

          {/* Password Section */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Password</h3>
                  <p className="text-sm text-gray-500">Ensure your account is secure with a strong password</p>
                </div>
                {!showPasswordForm && (
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Update Password
                  </button>
                )}
              </div>
            </div>
            {showPasswordForm && (
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value
                    })}
                    className="mt-1 block w-full px-4 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value
                    })}
                    className="mt-1 block w-full px-4 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value
                    })}
                    className="mt-1 block w-full px-4 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePasswordChange}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Save Password
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordForm({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                    }}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Subjects Section */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Subjects</h3>
                  <p className="text-sm text-gray-500">Manage the subjects you can evaluate</p>
                </div>
                <button
                  onClick={() => setEditMode({ ...editMode, subjects: !editMode.subjects })}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {editMode.subjects ? <MdClose className="text-xl" /> : <MdEdit className="text-xl" />}
                </button>
              </div>
            </div>
            <div className="px-6 py-4">
              {editMode.subjects ? (
                <div className="space-y-4">
                  <select
                    value=""
                    onChange={handleSubjectChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Subject</option>
                    {availableSubjects.map((subject, index) => (
                      <option key={index} value={subject}>{subject}</option>
                    ))}
                  </select>

                  <div className="flex flex-wrap gap-2">
                    {userProfile.subjects.map((subject, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {subject}
                        <button
                          type="button"
                          onClick={() => {
                            setUserProfile(prev => ({
                              ...prev,
                              subjects: prev.subjects.filter(s => s !== subject)
                            }));
                          }}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => handleSave('subjects')}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Update Subjects
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {userProfile.subjects.map((subject, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountSettings; 