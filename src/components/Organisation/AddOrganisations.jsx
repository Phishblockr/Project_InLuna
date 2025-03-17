import React, { useState } from 'react'
import { toast } from 'sonner';

const AddOrganisations = () => {
    const [accType, setAccType] = useState('individual');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        organizationName: '',
        fullName: '',
        totalUsers: ''
    });

    const apiUrl = import.meta.env.VITE_API_URL;

    const handleSelectChange = (e) => {
        setAccType(e.target.value);
        // Optionally clear fields that are not used for the selected type:
        setFormData((prevData) => ({
            ...prevData,
            organizationName: '',
            fullName: '',
            totalUsers: ''
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let endpoint = '';
            let payload = {};
            if (accType === 'business') {
                endpoint = `${apiUrl}/org/create`;
                payload = {
                    name: formData.organizationName,
                    adminEmail: formData.email,
                    adminName: formData.fullName,
                    totalUsers: formData.totalUsers,
                    adminPassword: ""
                };
            } else {
                endpoint = 'https://theinluna.com/api/register/individual';
                payload = {
                    name: formData.name,
                    email: formData.email
                };
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Something went wrong');
            }

            const data = await response.json();
            toast.success('Registration successful!');
            console.log('Response data:', data);
        } catch (error) {
            console.error('Error:', error.message);
            toast.error(`Error: ${error.message}`);
        }
    };



    return (
        <div className='z-1 min-h-[calc(100vh-65px)] flex flex-col justify-between relative right-0 bottom-0 p-4 gap-4'>
            <form onSubmit={handleSubmit} className="p-4 bg-white rounded-lg">
                <div className="mb-4">
                    <label htmlFor="accType" className="block font-medium mb-1">
                        User Type:
                    </label>
                    <select
                        id="accType"
                        value={accType}
                        onChange={handleSelectChange}
                        className="border border-gray-300 p-2 rounded w-full"
                    >
                        <option value="business">Business</option>
                        <option value="individual">Individual</option>
                    </select>
                </div>

                {accType === 'business' ? (
                    <>
                        <div className="mb-4">
                            <label htmlFor="organizationName" className="block font-medium mb-1">
                                Organization Name:
                            </label>
                            <input
                                id="organizationName"
                                type="text"
                                name="organizationName"
                                value={formData.organizationName}
                                onChange={handleChange}
                                className="border border-gray-300 p-2 rounded w-full"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="email" className="block font-medium mb-1">
                                Email Address:
                            </label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="border border-gray-300 p-2 rounded w-full"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="fullName" className="block font-medium mb-1">
                                Full Name:
                            </label>
                            <input
                                id="fullName"
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                className="border border-gray-300 p-2 rounded w-full"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="totalUsers" className="block font-medium mb-1">
                                Total Users in Organization:
                            </label>
                            <input
                                id="totalUsers"
                                type="number"
                                name="totalUsers"
                                value={formData.totalUsers}
                                onChange={handleChange}
                                className="border border-gray-300 p-2 rounded w-full"
                                required
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="mb-4">
                            <label htmlFor="name" className="block font-medium mb-1">
                                Name:
                            </label>
                            <input
                                id="name"
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="border border-gray-300 p-2 rounded w-full"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="email" className="block font-medium mb-1">
                                Email:
                            </label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="border border-gray-300 p-2 rounded w-full"
                                required
                            />
                        </div>
                    </>
                )}

                <button
                    type="submit"
                    className="bg-[#0364BD] text-white p-2 rounded-lg hover:bg-[#164a7a] transition-colors w-full"
                >
                    Submit
                </button>
            </form>
        </div>
    );
};


export default AddOrganisations