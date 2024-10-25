const LoadingSkeleton = ({ tabs }) => {
  return (
    <div className="bg-white min-h-screen px-12 pt-4 text-gray-800">
      <div className="flex justify-between items-center">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-8 bg-gray-200 rounded w-8"></div>
      </div>
      <hr className="mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="flex flex-wrap gap-3">
          {tabs.map((tab, index) => (
            <div key={index} className="h-10 bg-gray-200 rounded-lg w-20"></div>
          ))}
        </div>
        <div className="h-10 bg-gray-200 rounded-lg w-full max-w-2xl"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-gray-100 p-6 rounded-lg shadow-md">
            <div className="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingSkeleton;
