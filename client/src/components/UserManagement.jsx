import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig';


function UserManagement() {
  const [users, setUsers] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedRole, setSelectedRole] = useState('all');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'evaluator',
    subjects: [],
    assignedPapers: 0,
  });
  const [editingUser, setEditingUser] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchSubjects();
  }, []);

  const fetchUsers = async () => {
    try {
      console.log('Attempting to fetch users...');
      const response = await axiosInstance.get('/api/users');
      console.log('Response received:', response);
      setUsers(response.data);
    } catch (error) {
      console.log('Full error object:', error);
      console.log('Request config:', error.config);
      console.log('Request URL:', error.config?.url);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch users';
      alert(errorMessage);
      console.error('Error fetching users:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await axiosInstance.get('/api/users/subjects');
      setAvailableSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'evaluator',
      subjects: [],
      assignedPapers: 0,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      if (submitData.role !== 'evaluator') {
        delete submitData.subjects;
        delete submitData.assignedPapers;
      }
      
      if (editingUser) {
        await axiosInstance.put(`/api/users/${editingUser._id}`, submitData);
        setSuccessMessage('User updated successfully!');
      } else {
        await axiosInstance.post('/api/users/create', submitData);
        setSuccessMessage('User created successfully!');
      }
      resetForm();
      setEditingUser(null);
      fetchUsers();
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      alert(errorMessage);
    }
  };

  const generatePassword = () => {
    const length = 8;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let newPassword = "";
    for (let i = 0; i < length; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData({ ...formData, password: newPassword });
  };

  const handleDelete = async (user) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await axiosInstance.delete(`/api/users/${user._id}`);
        setSuccessMessage(response.data?.message || 'User deleted successfully');
        fetchUsers();
        
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Error deleting user';
        alert(errorMessage);
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleSubjectChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData({
      ...formData,
      subjects: selectedOptions
    });
  };

  const filteredUsers = users.filter(user => 
    selectedRole === 'all' ? true : user.role === selectedRole
  );

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      subjects: user.subjects || [],
      assignedPapers: user.assignedPapers || 0,
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
      )}

      <div className="bg-white p-8 rounded-lg shadow mb-8">
        <h2 className="text-xl font-bold mb-6">
          {editingUser ? 'Edit User' : 'Create New User'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                  required
                  placeholder="Enter username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                  required
                  placeholder="Enter email"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="flex-1 rounded-l-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                    required={!editingUser}
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="inline-flex items-center px-3 py-2 border border-l-0 border-green-500 rounded-r-md bg-green-500 text-white hover:bg-green-600 transition-colors duration-200"
                  >
                    Generate
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                >
                  <option value="admin">Admin</option>
                  <option value="evaluator">Evaluator</option>
                </select>
              </div>
            </div>

            {formData.role === 'evaluator' && (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Subjects
                  </label>
                  <select
                    value=""
                    onChange={(e) => {
                      const selectedSubject = e.target.value;
                      if (selectedSubject && !formData.subjects.includes(selectedSubject)) {
                        setFormData({
                          ...formData,
                          subjects: [...formData.subjects, selectedSubject]
                        });
                      }
                    }}
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                  >
                    <option value="">Select Subject</option>
                    {availableSubjects.map(subject => (
                      <option value={subject}>{subject}</option>
                    ))}
                  </select>

                  {/* Display selected subjects */}
                  <div className="mt-2">
                    {formData.subjects.map(subject => (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2 mb-2">
                        {subject}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              subjects: prev.subjects.filter(s => s !== subject)
                            }));
                          }}
                          className="ml-1 inline-flex text-blue-400 hover:text-blue-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Assigned Papers
                  </label>
                  <input
                    type="number"
                    value={formData.assignedPapers}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-100 cursor-not-allowed shadow-sm px-3 py-2"
                    readOnly
                    disabled
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-4">
            {editingUser && (
              <button
                type="button"
                onClick={() => {
                  setEditingUser(null);
                  setFormData({ username: '', email: '', password: '', role: 'evaluator', subjects: [], assignedPapers: 0 });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              {editingUser ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>

      <div className="mb-4">
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-1 text-sm"
        >
          <option value="all">All Users</option>
          <option value="admin">Admins</option>
          <option value="evaluator">Evaluators</option>
        </select>
      </div>

      <div className="bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-28 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
              <th className="w-40 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              {selectedRole !== 'admin' && (
                <>
                  <th className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subjects</th>
                  <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Papers</th>
                </>
              )}
              <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map(user => (
              <tr key={user._id}>
                <td className="px-3 py-3 text-sm">{user.username}</td>
                <td className="px-3 py-3 text-sm break-words">{user.email}</td>
                <td className="px-3 py-3 text-sm capitalize">{user.role}</td>
                {selectedRole !== 'admin' && (
                  <>
                    <td className="px-3 py-3 text-sm">
                      {user.role === 'evaluator' ? (
                        <div className="flex flex-col gap-1">
                          {user.subjects?.map(subject => (
                            <span 
                              key={subject} 
                              className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                            >
                              {subject}
                            </span>
                          ))}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-3 py-3 text-sm">
                      {user.role === 'evaluator' ? user.assignedPapers : '-'}
                    </td>
                  </>
                )}
                <td className="px-3 py-3 text-sm">
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserManagement; 