"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const DB_TYPES = ["postgresql", "mysql", "sqlite"];

const DEFAULT_PORTS = {
  postgresql: "5432",
  mysql: "3306",
  sqlite: "",
};

export default function DBConnectForm() {
  const router = useRouter();
  const [dbType, setDbType] = useState("postgresql");
  const [form, setForm] = useState({
    username: "", password: "", host: "localhost",
    port: "5432", database: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTypeChange = (type) => {
    setDbType(type);
    setForm((prev) => ({ ...prev, port: DEFAULT_PORTS[type] }));
    setError("");
  };

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleConnect = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/nl-sql/connect/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ db_type: dbType, ...form }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Connection failed");

      // Store session info in sessionStorage
      sessionStorage.setItem("nl_sql_session_key", data.session_key);
      sessionStorage.setItem("nl_sql_tables", JSON.stringify(data.tables));
      sessionStorage.setItem("nl_sql_schema", data.schema);
      sessionStorage.setItem("nl_sql_db_type", dbType);

      router.push("/nl-sql/chat");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isSQLite = dbType === "sqlite";

  return (
    <div className="w-full max-w-md mx-auto">
      {/* DB Type Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6">
        {DB_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => handleTypeChange(type)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all capitalize
              ${dbType === type
                ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {!isSQLite && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Host
                </label>
                <input
                  name="host"
                  value={form.host}
                  onChange={handleChange}
                  placeholder="localhost"
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 
                    rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Port
                </label>
                <input
                  name="port"
                  value={form.port}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 
                    rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Database name
              </label>
              <input
                name="database"
                value={form.database}
                onChange={handleChange}
                placeholder="mydb"
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 
                  rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Username
                </label>
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="postgres"
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 
                    rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Password
                </label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 
                    rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </>
        )}

        {isSQLite && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 
            dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-200">
            SQLite upload is handled via the API. Provide the server-side file path below.
            <input
              name="database"
              value={form.database}
              onChange={handleChange}
              placeholder="/path/to/database.db"
              className="mt-3 w-full px-3 py-2 text-sm border border-amber-200 dark:border-amber-700
                rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 
            dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <button
          onClick={handleConnect}
          disabled={loading}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
            text-white text-sm font-medium rounded-lg transition-colors
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Connecting...
            </span>
          ) : "Connect"}
        </button>
      </div>
    </div>
  );
}