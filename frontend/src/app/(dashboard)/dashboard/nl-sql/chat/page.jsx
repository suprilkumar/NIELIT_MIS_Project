"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SchemaViewer from "../_components/SchemaViewer";
import ChatWindow from "../_components/ChatWindow";

export default function ChatPage() {
  const router = useRouter();
  const [sessionKey, setSessionKey] = useState(null);
  const [tables, setTables]         = useState([]);
  const [schema, setSchema]         = useState("");
  const [dbType, setDbType]         = useState("");

  useEffect(() => {
    const key    = sessionStorage.getItem("nl_sql_session_key");
    const tbls   = sessionStorage.getItem("nl_sql_tables");
    const scm    = sessionStorage.getItem("nl_sql_schema");
    const db     = sessionStorage.getItem("nl_sql_db_type");

    if (!key) {
      router.replace("/nl-sql");   // redirect if no session
      return;
    }

    setSessionKey(key);
    setTables(tbls ? JSON.parse(tbls) : []);
    setSchema(scm || "");
    setDbType(db || "");
  }, [router]);

  if (!sessionKey) return null;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <aside className="w-72 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 
        bg-white dark:bg-gray-900 flex flex-col">
        
        {/* Logo / Back */}
        <div className="flex items-center justify-between px-4 py-4 
          border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 9l3 3-3 3m5 0h3"/>
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">NL→SQL</span>
          </div>
          <button
            onClick={() => router.push("/nl-sql")}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 
              px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Disconnect
          </button>
        </div>

        {/* DB Info */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"/>
            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {dbType} · {tables.length} tables
            </span>
          </div>
        </div>

        {/* Schema Viewer */}
        <div className="flex-1 overflow-y-auto p-4">
          <SchemaViewer schema={schema} tables={tables} />
        </div>

        {/* Clear session */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={() => {
              sessionStorage.clear();
              router.push("/nl-sql");
            }}
            className="w-full py-2 text-xs text-red-500 hover:text-red-700 
              hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
          >
            Clear session & disconnect
          </button>
        </div>
      </aside>

      {/* Chat area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center px-6 py-4 border-b border-gray-200 
          dark:border-gray-800 bg-white dark:bg-gray-900">
          <h1 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Ask your database anything
          </h1>
        </header>

        {/* Chat */}
        <div className="flex-1 overflow-hidden bg-white dark:bg-gray-900">
          <ChatWindow sessionKey={sessionKey} />
        </div>
      </main>
    </div>
  );
}