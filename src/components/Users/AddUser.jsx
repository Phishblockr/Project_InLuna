import React, { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addUser, getUsers } from '../../features/Users/usersSlice';
import { toast } from 'sonner';
import { PiUserCircleLight } from "react-icons/pi";
import { RiUploadCloud2Line, RiAddFill } from "react-icons/ri";
import AuthenticateModal from '../../utils/AuthenticateModal';
import { handleVerifyPwd } from '../../utils/handleVerifyPwd';

const AddUser = () => {
    const textBarStyle = "w-full p-2 rounded-t-lg border-b-2 border-dashed bg-gray-100 border-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001C40] dark:border-0"
    const [image, setImage] = useState(null);
    const hiddenFileInput = useRef(null);

    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [operationType, setOperationType] = useState(null);
    const apiUrl = import.meta.env.VITE_API_URL

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: '',
        department: '',
        status: 'active', // Added a default status
        img: '',
        gender: 'other',
        userType: 'user'
    });

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prevState => ({
                ...prevState,
                img: reader.result // This will store the base64 string
            }));
            setImage(file); // Optionally, still keep the file for preview purposes
        };
        reader.readAsDataURL(file); // Convert to base64 string
    };

    const handleClick = () => {
        hiddenFileInput.current.click();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        handlePasswordModalOpen(null, "add")
    };

    const executeAddUser = async () => {
        try {
            await dispatch(addUser(formData));
            toast.success('User added successfully');
            dispatch(getUsers());
            navigate('/users');
        } catch (error) {
            toast.error('Failed to add user');
        }
    }

    const handlePasswordModalOpen = (user, type) => {
        // setSelectedUrl(user);
        setOperationType(type);
        setIsPasswordModalOpen(true);
    };

    const handlePasswordConfirm = async (password) => {
        const token = JSON.parse(localStorage.getItem("user")).token;
        const result = await handleVerifyPwd(password, apiUrl, token);

        if (result) {
            if (operationType === "add") {
                executeAddUser();
            }
            setIsPasswordModalOpen(false);
        }
    };

    return (
        <div className="z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] h-[calc(100svh-65px)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-4">
            <AuthenticateModal isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onConfirm={handlePasswordConfirm}
            />
            <div className='z-1 w-full font-medium bg-white rounded-xl shadow-xl p-3 h-full dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none'>
                <div>
                    <h1 className="pt-3 pl-5 text-2xl font-medium">Add User</h1>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col items-center justify-between">
                    <div>
                        <label htmlFor="image-upload-input">
                            {image ? "Click on upload" : "Choose an image"}
                        </label>
                        <div onClick={handleClick} style={{ cursor: "pointer" }}>
                            {image ? (
                                <img
                                    src={URL.createObjectURL(image)}
                                    alt="upload image"
                                    className="mt-2 w-[150px] h-[150px] rounded-full"
                                />
                            ) : (
                                <PiUserCircleLight className="mt-2 w-[150px] h-[150px] rounded-full" />
                            )}

                            <input
                                id="image-upload-input"
                                type="file"
                                onChange={handleImageChange}
                                ref={hiddenFileInput}
                                style={{ display: "none" }}
                            />
                        </div>
                    </div>
                    {/* <button type="button" className="mt-2 bg-[#0364BD] hover:bg-[#003A70] transition p-2 rounded-lg text-white" onClick={handleClick}>
            <span className="flex flex-row gap-x-1">
              <RiUploadCloud2Line className="w-6 h-6" /> Upload Image
            </span>
          </button> */}
                    <div className="mt-5 flex flex-col w-full items-center px-3">
                        <div className="flex flex-row gap-5 w-full">
                            <div className="flex flex-col w-full">
                                <label htmlFor="name">Name: </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    className={textBarStyle}
                                    onChange={handleChange}
                                    value={formData.name}
                                />
                            </div>

                            <div className="flex flex-col w-full">
                                <label htmlFor="gender">Gender: </label>
                                <select
                                    className={textBarStyle}
                                    name="gender"
                                    id="gender"
                                    onChange={handleChange}
                                    value={formData.gender}
                                >
                                    <option value="other">Other</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>

                                </select>
                            </div>
                        </div>

                        <div className="mt-5 flex flex-row gap-5 w-full">

                            <div className="flex flex-col w-full">
                                <label htmlFor="email">Email: </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    className={textBarStyle}
                                    onChange={handleChange}
                                    value={formData.email}
                                />
                            </div>


                            <div className="flex flex-col w-full">
                                <label htmlFor="phone">Phone: </label>
                                <input
                                    type="text"
                                    id="phone"
                                    name="phone"
                                    className={textBarStyle}
                                    onChange={handleChange}
                                    value={formData.phone}
                                />
                            </div>

                        </div>

                        <div className="mt-5 flex flex-row gap-5 w-full">

                            <div className="flex flex-col w-full">
                                <label htmlFor="role">Role: </label>
                                <input
                                    type="text"
                                    id="role"
                                    name="role"
                                    className={textBarStyle}
                                    onChange={handleChange}
                                    value={formData.role}
                                />
                            </div>

                            <div className="flex flex-col w-full">
                                <label htmlFor="department">Department: </label>
                                <input
                                    type="text"
                                    id="department"
                                    name="department"
                                    className={textBarStyle}
                                    onChange={handleChange}
                                    value={formData.department}
                                />
                            </div>

                        </div>

                        <div className=" mt-5 flex flex-row gap-5 w-full">

                            <div className=" flex flex-col w-full">
                                <label htmlFor="status">Status: </label>
                                <select
                                    className={textBarStyle}
                                    name="status"
                                    id="status"
                                    onChange={handleChange}
                                    value={formData.status}
                                >
                                    <option value="inactive">Inactive</option>
                                    <option value="active">Active</option>
                                </select>
                            </div>

                            <div className="flex flex-col w-full">
                                <label htmlFor="userType">User Type: </label>
                                <select
                                    className={textBarStyle}
                                    name="userType"
                                    id="userType"
                                    onChange={handleChange}
                                    value={formData.userType}
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>

                        <button type="submit" className=" mt-9 mb-2 rounded-lg text-white font-medium w-full bg-[#0364BD] hover:bg-[#003A70] transition p-2 ">
                            <span className="flex flex-row justify-center items-center">
                                <RiAddFill className="w-6 h-6 mr-1" /> Submit
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddUser;
