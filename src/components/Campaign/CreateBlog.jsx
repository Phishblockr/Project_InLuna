import React, { useState } from "react";
import { toast } from "sonner";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css"; // import styles for Quill

const CreateBlog = () => {
  const [blogTitle, setBlogTitle] = useState("");
  const [blogContent, setBlogContent] = useState("");

  const handleBlogSave = async (e) => {
    e.preventDefault();
    if (blogTitle && blogContent) {
      // Save the blog (you can make a POST request to the server here)
      console.log("Blog Saved:", { blogTitle, blogContent });

      toast.success("Blog saved successfully!");
      setBlogTitle("");
      setBlogContent("");
    } else {
      toast.error("Please fill in both fields.");
    }
  };

  return (
    <div className="z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] min-h-[calc(100vh-65px)] flex flex-col justify-between relative left-[16rem] right-0 bottom-0 p-4 gap-4">
      <div className="container p-4">
        <h2 className="text-xl font-semibold">Create Blog</h2>
        <form onSubmit={handleBlogSave} className="space-y-4">
          <div>
            <label htmlFor="blogTitle" className="block text-sm font-semibold">Blog Title</label>
            <input
              type="text"
              id="blogTitle"
              value={blogTitle}
              onChange={(e) => setBlogTitle(e.target.value)}
              className="mt-2 block w-full p-3 border border-gray-300 rounded-md focus:outline-blue-400"
              placeholder="Enter blog title"
              required
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="blogContent" className="block text-sm font-semibold">
                Blog Content
              </label>
              <ReactQuill
                value={blogContent}
                onChange={setBlogContent}
                modules={{
                  toolbar: [
                    [{ 'header': '1' }, { 'header': '2' }, { 'font': [] }],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    ['bold', 'italic', 'underline'],
                    ['link', 'image'],
                    ['blockquote'],
                    [{ 'align': [] }],
                    ['clean'],
                  ],
                }}
                className="mt-2 text-xl block w-full p-3 border border-gray-300 rounded-md"
                placeholder="Enter the content of the blog"
                required
              />
            </div>
          </div>

          <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded-md">
            Save Blog
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateBlog;
