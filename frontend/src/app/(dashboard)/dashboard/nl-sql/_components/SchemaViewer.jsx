"use client";
import { useState } from "react";

export default function SchemaViewer({ schema, tables }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 
          bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750
          text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 7h16M4 12h16M4 17h7" />
          </svg>
          <span>Schema</span>
          <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 
            dark:text-blue-300 text-xs rounded-md font-medium">
            {tables.length} tables
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          {/* Table name pills */}
          <div className="flex flex-wrap gap-1.5 p-3 border-b border-gray-100 dark:border-gray-700">
            {tables.map((t) => (
              <span key={t} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 
                text-gray-600 dark:text-gray-300 text-xs rounded-md font-mono">
                {t}
              </span>
            ))}
          </div>
          {/* Full schema */}
          <pre className="p-4 text-xs text-gray-600 dark:text-gray-400 font-mono 
            overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto leading-relaxed">
            {schema}
          </pre>
        </div>
      )}
    </div>
  );
}