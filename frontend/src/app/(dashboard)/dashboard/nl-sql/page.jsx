import DBConnectForm from "./_components/DBConnectForm";

export const metadata = { title: "Connect Database" };

export default function NLSQLPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 
            bg-blue-100 dark:bg-blue-900 rounded-2xl mb-4">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" 
              viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"/>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Chat with your database
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Connect a database and ask questions in plain English
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 
          dark:border-gray-800 p-6 shadow-sm">
          <DBConnectForm />
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-4">
          Powered by Groq · LangChain · DRF
        </p>
      </div>
    </div>
  );
}