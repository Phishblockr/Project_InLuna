import React, { useRef, useState } from "react";
import { RiAddFill, RiUploadCloud2Line } from "react-icons/ri";
import defaultUser from "../assets/default_profile_picture.jpg";
import { useDispatch } from "react-redux";
import { useNavigate } from 'react-router-dom';
import { addUser } from "../features/Insights/insightsSlice";
import { toast } from "sonner";

const AddEmp = () => {
  const [image, setImage] = useState('');
  const ref = useRef(null);
  const [user, setUser] = useState({ id: "", name: "", email: "", department: "", img: image })
  const disp = useDispatch();
  const nav = useNavigate();

  const isValidEmail = email => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleAddUser = (user) => {
    console.log(user);
    if (isValidEmail(user.email)) {
      disp(addUser(user));
      toast.success(`Employee ${user.name} added!!!`);
      nav('/insights');
    } else {
      toast.error('Please enter a valid email address');
      return;
    }
  }

  const handleImageUpload = (event) => {
    const reader = new FileReader();
    reader.readAsDataURL(event.target.files[0]);
    reader.onload = () => {
      setImage(reader.result);
      setUser({ ...user, img: reader.result });
    }
  }

  return (
    <div className="z-1 w-[calc(100svw-17.5rem)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4">
      <div className='z-1 font-medium bg-white rounded-xl shadow-xl p-3 h-max'>
        <div>
          <h1 className="pt-3 pl-5 text-2xl font-medium">Add Employee</h1>
        </div>
        <div className="flex flex-col items-center justify-between">
          <div>
            <label htmlFor="image-upload-input">
              {image ? "Click on upload" : "Choose an image"}
            </label>
            <div style={{ cursor: "pointer" }}>
              {image ? (
                <img
                  src={image}
                  alt="upload image"
                  className="mt-2 w-[150px] h-[150px] rounded-full"
                />
              ) : (
                <img
                  src={defaultUser}
                  alt="upload image"
                  className="mt-2 w-[150px] h-[150px] rounded-full"
                />
              )}

              <input
                id="image-upload-input"
                type="file"
                onChange={handleImageUpload}
                style={{ display: "none" }}
                src={image}
                ref={ref}
                accept="image/png, image/jpeg, image/jpg"
              />
            </div>
          </div>
          <button onClick={() => ref.current.click()} className="mt-2 bg-[#0364BD] hover:bg-[#003A70] transition p-2 rounded-lg text-white">
            <span className="flex flex-row gap-x-1">
              <RiUploadCloud2Line className="w-6 h-6" /> Upload Image
            </span>
          </button>
        </div>
        <div className="mt-3 flex flex-col w-full items-center">
          <div className="flex flex-col">
            <label htmlFor="id">Employee-id: </label>
            <input
              type="number"
              id="id"
              name="id"
              className=" w-[40rem] p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0364BD]"
              placeholder="#017523"
              onChange={e => setUser({ ...user, [e.target.name]: e.target.value })}
            />
          </div>

          <div className="mt-3 flex flex-col">
            <label htmlFor="name">Name: </label>
            <input
              type="text"
              id="name"
              name="name"
              className=" w-[40rem] p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0364BD]"
              placeholder="John Doe"
              onChange={e => setUser({ ...user, [e.target.name]: e.target.value })}
            />
          </div>

          <div className="mt-3 flex flex-col">
            <label htmlFor="email">Email: </label>
            <input
              type="email"
              id="email"
              name="email"
              className=" w-[40rem] p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0364BD]"
              placeholder="johndoe@example.com"
              onChange={e => setUser({ ...user, [e.target.name]: e.target.value })}
            />
          </div>

          <div className="mt-3 flex flex-col">
            <label htmlFor="department">Department: </label>
            <input
              type="text"
              id="department"
              name="department"
              className=" w-[40rem] p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0364BD]"
              placeholder="IT"
              onChange={e => setUser({ ...user, [e.target.name]: e.target.value })}
            />
          </div>
          <button onClick={() => handleAddUser(user)} className=" mt-9 mb-2 rounded-lg text-white font-medium w-[40rem] bg-[#0364BD] hover:bg-[#003A70] transition p-2 ">
            {" "}
            <span className="flex flex-row justify-center items-center">
              <RiAddFill className="w-6 h-6 mr-1" /> add employee
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddEmp;
