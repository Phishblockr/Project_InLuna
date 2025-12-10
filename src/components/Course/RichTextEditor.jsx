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
                    // keep semantic class for links; color is controlled by surrounding styles
                    class: "underline",
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
                // Keep editor content class lightweight; visual styles come from container
                // add explicit dark/light text classes and ensure the editor inherits color
                class: "ProseMirror prose prose-sm max-w-none focus:outline-none text-gray-900 dark:text-white",
                style: "color: inherit;",
            },
        },
    });

    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value || "");
        }
    }, [value, editor]);

    // Small helper to build button classes that adapt to light/dark themes and active state.
    const toolbarBtn = (label, action, isActive) => {
        const base =
            "px-2 py-1 text-sm rounded transition-colors flex items-center justify-center";
        const lightStyles = isActive
            ? "bg-blue-100 border border-blue-400 text-gray-900"
            : "bg-white border border-gray-300 text-gray-900 hover:bg-gray-100";
        const darkStyles = isActive
            ? "dark:bg-[#034a82] dark:border-[#0364BD] dark:text-white"
            : "dark:bg-transparent dark:border-[#001c40] dark:text-gray-200 dark:hover:bg-[#001c40]";
        return (
            <button
                type="button"
                onClick={action}
                className={`${base} ${lightStyles} ${darkStyles}`}
            >
                {label}
            </button>
        );
    };

    if (!editor)
        return (
            <div className="p-2 text-sm text-gray-500 dark:text-gray-300">
                Loading editor...
            </div>
        );

    const setLink = () => {
        const prev = editor.getAttributes("link").href;
        const url = window.prompt("Enter URL", prev || "https://");
        if (url === null) return; // cancelled
        if (url === "") {
            editor.chain().focus().unsetLink().run();
            return;
        }
        editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: url })
            .run();
    };

    return (
        <div
            className="rounded overflow-hidden border bg-white text-gray-900
                 dark:bg-[#001c40] dark:text-white
                 border-gray-300 dark:border-[#001c40]"
        >
            {/* Toolbar */}
            <div
                className="flex flex-wrap gap-1 p-2 border-b
                   bg-gray-50 border-gray-200
                   dark:bg-[#002451] dark:border-[#001c40]"
            >
                {toolbarBtn(
                    "B",
                    () => editor.chain().focus().toggleBold().run(),
                    editor.isActive("bold"),
                )}
                {toolbarBtn(
                    "I",
                    () => editor.chain().focus().toggleItalic().run(),
                    editor.isActive("italic"),
                )}
                {toolbarBtn(
                    "U",
                    () => editor.chain().focus().toggleUnderline().run(),
                    editor.isActive("underline"),
                )}
                {toolbarBtn(
                    "H2",
                    () =>
                        editor
                            .chain()
                            .focus()
                            .toggleHeading({ level: 2 })
                            .run(),
                    editor.isActive("heading", { level: 2 }),
                )}
                {toolbarBtn(
                    "P",
                    () => editor.chain().focus().setParagraph().run(),
                    editor.isActive("paragraph"),
                )}
                {toolbarBtn(
                    "Quote",
                    () => editor.chain().focus().toggleBlockquote().run(),
                    editor.isActive("blockquote"),
                )}
                {toolbarBtn(
                    "HR",
                    () => editor.chain().focus().setHorizontalRule().run(),
                    false,
                )}
                {toolbarBtn("Link", setLink, editor.isActive("link"))}
                {toolbarBtn(
                    "Undo",
                    () => editor.chain().focus().undo().run(),
                    false,
                )}
                {toolbarBtn(
                    "Redo",
                    () => editor.chain().focus().redo().run(),
                    false,
                )}
                {toolbarBtn(
                    "Clear",
                    () => editor.chain().focus().clearContent().run(),
                    false,
                )}
            </div>

            {/* Editor content area */}
            <div
                className="p-2 bg-white text-gray-900
                   dark:bg-[#002451] dark:text-white
                   min-h-[120px] max-h-[480px] overflow-auto"
            >
                {value === "" && editor.getHTML() === "" && (
                    <div className="pointer-events-none text-gray-400 text-sm select-none dark:text-gray-400">
                        {placeholder}
                    </div>
                )}
                <EditorContent editor={editor} />
            </div>

            {/* Scoped scrollbar + small ProseMirror adjustments for dark mode */}
            <style>{`
        /* Thin scrollbar for webkit browsers within this editor */
        .ProseMirror, .ProseMirror *::-webkit-scrollbar, .ProseMirror *::-webkit-scrollbar-thumb {
          /* ensure nested scroll regions inherit subtle styling */
        }
        .ProseMirror::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .ProseMirror::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.12);
          border-radius: 9999px;
        }
        /* When in dark backgrounds prefer a lighter thumb */
        @media (prefers-color-scheme: dark) {
          .ProseMirror::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.08);
          }
        }

        /* Firefox thin scrollbar coloring */
        .ProseMirror {
          scrollbar-width: thin;
          scrollbar-color: rgba(0,0,0,0.12) transparent;
        }
        @media (prefers-color-scheme: dark) {
          .ProseMirror {
            scrollbar-color: rgba(255,255,255,0.08) transparent;
          }
        }

        /* Ensure the editor content area inherits text color and spacing nicely */
        .ProseMirror {
          outline: none;
          min-height: 100px;
          color: inherit;
        }

        /* Make sure code/pre blocks keep good contrast */
        .ProseMirror pre {
          background: transparent;
          color: inherit;
        }

        /* Links: in light mode blue, in dark mode lighter blue */
        .ProseMirror a {
          color: #0364BD;
        }
        @media (prefers-color-scheme: dark) {
          .ProseMirror a {
            color: #7fc1ff;
          }
        }
      `}</style>
        </div>
    );
};

export default RichTextEditor;
