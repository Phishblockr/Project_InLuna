import React, { useRef, useState } from "react";
import defaultUser from "../assets/default_profile_picture.jpg";

const AddUser = () => {
  const [image, setImage] = useState(null);
  const hiddenFileInput = useRef(null);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    const imgName = event.target.files[0].name;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const image = new Image();
      image.src = reader.result;
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = Math.max(image.width, image.height);
        canvas.width = maxSize;
        canvas.height = maxSize;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(
          image,
          (maxSize - image.width) / 2,
          (maxSize - image.height) / 2
        );
        canvas.toBlob(
          (blob) => {
            const file = new File([blob], imgName, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            setImage(file);
          },
          "image/jpeg",
          0.8
        );
      };
    };
  };

  // TODO: Upload Function

  const handleClick = (event) => {
    hiddenFileInput.current.click();
  };

  return (
    <div className="z-1 w-[calc(100svw-16rem)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-4">
      <div className='<div className="z-1 w-full font-bold bg-white rounded-xl shadow-xl p-3 h-max">'>
        <div>
          <h1 className="pt-3 pl-5 text-2xl font-bold">Add User</h1>
        </div>
        <div className="flex flex-col items-center justify-between">
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
                <img
                  src={defaultUser}
                  alt="upload image"
                  className="mt-2 w-[150px] h-[150px] rounded-full"
                />
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
          <button className="mt-2 bg-[#0364BD] hover:bg-[#003A70] transition p-2 rounded-lg text-white">
            Upload Image
          </button>
        </div>
        <div className="mt-3 flex flex-col w-full items-center">
          <div className="flex flex-col">
            <label htmlFor="name">Name: </label>
            <input
              type="text"
              id="name"
              name="name"
              className=" w-[40rem] p-2 rounded-lg border border-gray-300"
            />
          </div>

          <div className="mt-3 flex flex-col">
            <label htmlFor="email">Email: </label>
            <input
              type="text"
              id="email"
              name="email"
              className=" w-[40rem] p-2 rounded-lg border border-gray-300"
            />
          </div>

          <div className="mt-3 flex flex-col">
            <label htmlFor="role">Role: </label>
            <input
              type="text"
              id="role"
              name="role"
              className=" w-[40rem] p-2 rounded-lg border border-gray-300"
            />
          </div>

          <div className="mt-3 flex flex-col">
            <label htmlFor="department">Department: </label>
            <input
              type="text"
              id="department"
              name="department"
              className=" w-[40rem] p-2 rounded-lg border border-gray-300"
            />
          </div>
          <button className=" mt-9 mb-2 rounded-lg text-white font-bold w-[40rem] bg-[#0364BD] hover:bg-[#003A70] transition p-2 ">Submit</button>
          
        </div>
      </div>
    </div>
  );
};

export default AddUser;
