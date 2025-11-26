import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import DOMPurify from "dompurify";

/*
  Reusable TipTap based rich text editor.
  Props:
    value (HTML string)
    onChange(html string) - sanitized via DOMPurify
    placeholder (string, optional)
*/
const RichTextEditor = ({
  value = "",
  onChange,
  placeholder = "Start typing...",
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
          class: "text-blue-600 underline",
        },
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (onChange) {
        onChange(DOMPurify.sanitize(html));
      }
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none",
      },
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  if (!editor)
    return <div className="p-2 text-sm text-gray-500">Loading editor...</div>;

  const setLink = () => {
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL", prev || "https://");
    if (url === null) return; // cancelled
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const toolbarBtn = (label, action, isActive) => (
    <button
      type="button"
      onClick={action}
      className={`px-2 py-1 text-sm rounded border bg-white hover:bg-gray-100 ${
        isActive ? "bg-blue-100 border-blue-400" : "border-gray-300"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="border rounded overflow-hidden">
      <div className="flex flex-wrap gap-1 p-2 border-b bg-white">
        {toolbarBtn(
          "B",
          () => editor.chain().focus().toggleBold().run(),
          editor.isActive("bold")
        )}
        {toolbarBtn(
          "I",
          () => editor.chain().focus().toggleItalic().run(),
          editor.isActive("italic")
        )}
        {toolbarBtn(
          "U",
          () => editor.chain().focus().toggleUnderline().run(),
          editor.isActive("underline")
        )}
        {toolbarBtn(
          "H2",
          () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          editor.isActive("heading", { level: 2 })
        )}
        {toolbarBtn(
          "P",
          () => editor.chain().focus().setParagraph().run(),
          editor.isActive("paragraph")
        )}
        {/* {toolbarBtn(
          "• List",
          () => editor.chain().focus().toggleBulletList().run(),
          editor.isActive("bulletList")
        )}
        {toolbarBtn(
          "1. List",
          () => editor.chain().focus().toggleOrderedList().run(),
          editor.isActive("orderedList")
        )} */}
        {toolbarBtn(
          "Quote",
          () => editor.chain().focus().toggleBlockquote().run(),
          editor.isActive("blockquote")
        )}
        {toolbarBtn(
          "HR",
          () => editor.chain().focus().setHorizontalRule().run(),
          false
        )}
        {toolbarBtn("Link", setLink, editor.isActive("link"))}
        {toolbarBtn("Undo", () => editor.chain().focus().undo().run(), false)}
        {toolbarBtn("Redo", () => editor.chain().focus().redo().run(), false)}
        {toolbarBtn(
          "Clear",
          () => editor.chain().focus().clearContent().run(),
          false
        )}
      </div>
      <div className="p-2 bg-white">
        {value === "" && editor.getHTML() === "" && (
          <div className="pointer-events-none text-gray-400 text-sm select-none">
            {placeholder}
          </div>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default RichTextEditor;
