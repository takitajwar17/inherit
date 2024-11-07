import { LANGUAGE_VERSIONS } from "@/app/constants";
import { useState } from "react";

const languages = Object.entries(LANGUAGE_VERSIONS);
const ACTIVE_COLOR = "blue-400";

const LanguageSelector = ({ language, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="ml-2 mb-4">
      <span className="mb-2 text-lg block">Language:</span>
      <div className="relative inline-block text-left">
        <button
          className="bg-gray-800 text-white px-4 py-2 rounded"
          onClick={() => setIsOpen(!isOpen)}
        >
          {language}
        </button>
        {isOpen && (
          <div className="absolute z-10 mt-2 w-48 rounded-md shadow-lg bg-[#110c1b]">
            {languages.map(([lang, version]) => (
              <button
                key={lang}
                className={`${
                  lang === language ? "text-blue-400 bg-gray-900" : "text-white"
                } block w-full text-left px-4 py-2 hover:bg-gray-900`}
                onClick={() => onSelect(lang)}
              >
                {lang}
                &nbsp;
                <span className="text-gray-600 text-sm">({version})</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LanguageSelector;
