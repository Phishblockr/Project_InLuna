import React, { useRef, useState } from "react";
import { toast } from "sonner";
import Editor from '@monaco-editor/react';

const CreateTemplate = () => {
  const [templateName, setTemplateName] = useState("");
  const [templateBody, setTemplateBody] = useState("");

  // Handle changes in the textarea
  const handleTemplateBodyChange = (e) => {
    setTemplateBody(e.target.value);
  };

  const handleTemplateSave = async (e) => {
    e.preventDefault();
    if (templateName && templateBody) {
      // Save the template (you can make a POST request to the server here)
      console.log("Template Saved:", { templateName, templateBody });

      toast.success("Template saved successfully!");
      setTemplateName("");
      setTemplateBody("");
    } else {
      toast.error("Please fill in both fields.");
    }
  };

  return (
    <div className="z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] min-h-[calc(100vh-65px)] flex flex-col justify-between relative left-[16rem] right-0 bottom-0 p-4 gap-4">
      <div className="container p-4">
        <h2 className="text-xl font-semibold">Create HTML Template</h2>
        <form onSubmit={handleTemplateSave} className="space-y-4">
          <div>
            <label htmlFor="templateName" className="block text-sm font-semibold">Template Name</label>
            <input
              type="text"
              id="templateName"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="mt-2 block w-full p-3 border border-gray-300 rounded-md"
              placeholder="Enter template name"
              required
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1 ">
              <label htmlFor="templateBody" className="block text-sm font-semibold">Template Body (HTML Code)</label>
              {/* <textarea
                id="templateBody"
                value={templateBody}
                onChange={handleTemplateBodyChange}
                rows="10"
                className="mt-2 block w-full p-3 border border-gray-300 rounded-md"
                placeholder="Enter the HTML content of the template"
                style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', minHeight: '200px' }}
              ></textarea> */}

              <div className="p-4 mt-2 bg-white rounded-md">
                <Editor
                  language="html"
                  height={400}
                  width={'100%'}
                  className="rounded-md"
                  value={templateBody}
                  theme="light"
                  onChange={val => {
                    setTemplateBody(val)
                  }}
                />
              </div>
            </div>

            <div className="flex-1">
              <label htmlFor="templateBodyPreview" className="block text-sm font-semibold">Template Preview</label>
              <div
                id="templateBodyPreview"
                className="mt-2 p-4 border border-gray-300 rounded-md h-[400px] bg-white"
                dangerouslySetInnerHTML={{ __html: templateBody }} // Render the HTML content dynamically
              ></div>
            </div>
          </div>

          <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded-md">
            Save Template
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateTemplate;
