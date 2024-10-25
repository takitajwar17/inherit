const TabsAndSearch = ({ activeTab, setActiveTab, tabs }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="flex flex-wrap gap-3">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`py-2 px-4 rounded-lg ${
              activeTab === tab
                ? "bg-orange text-white"
                : "bg-gray-100 text-gray-600"
            } hover:bg-red-100`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="flex items-center ml-auto bg-gray-100 p-2 rounded-lg w-full max-w-2xl max-h-10">
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent outline-none text-gray-700 w-full py-0.25 px-2"
        />
        <button className="text-gray-500 hover:text-gray-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TabsAndSearch;
