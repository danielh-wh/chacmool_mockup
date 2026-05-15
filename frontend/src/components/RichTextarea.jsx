import React, { useMemo } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import "./RichTextarea.css";

/**
 * Rich text editor compatible with the existing TextArea API.
 *
 * Props:
 *   - value: HTML string
 *   - onChange: (html: string) => void   ← receives plain HTML, NOT an event
 *   - placeholder: string
 *   - rows: visual height (translated to a min-height in CSS)
 *   - testId: data-testid for testing
 */
const RichTextarea = ({ value = "", onChange, placeholder = "", rows = 4, testId }) => {
  const config = useMemo(
    () => ({
      // Required since CKEditor 5 v44+. 'GPL' is the free open-source license.
      licenseKey: "GPL",
      placeholder,
      toolbar: {
        items: [
          "heading",
          "|",
          "bold",
          "italic",
          "underline",
          "|",
          "bulletedList",
          "numberedList",
          "|",
          "outdent",
          "indent",
          "|",
          "link",
          "blockQuote",
          "|",
          "undo",
          "redo",
        ],
        shouldNotGroupWhenFull: false,
      },
      // Limit heading options to keep the toolbar compact and PDF-friendly.
      heading: {
        options: [
          { model: "paragraph", title: "Párrafo", class: "ck-heading_paragraph" },
          { model: "heading2", view: "h2", title: "Título", class: "ck-heading_heading2" },
          { model: "heading3", view: "h3", title: "Subtítulo", class: "ck-heading_heading3" },
        ],
      },
    }),
    [placeholder],
  );

  // Translate the rows prop into a CSS variable used by RichTextarea.css.
  const minHeight = `${Math.max(rows, 2) * 22 + 30}px`;

  return (
    <div className="rich-textarea" style={{ "--rt-min-h": minHeight }} data-testid={testId}>
      <CKEditor
        editor={ClassicEditor}
        data={value || ""}
        config={config}
        onChange={(_, editor) => {
          const html = editor.getData();
          onChange?.(html);
        }}
      />
    </div>
  );
};

export default RichTextarea;
