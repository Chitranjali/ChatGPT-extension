
export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">ChatGPT Navigator Extension</h1>
          <p className="text-xl text-gray-600">
            A Chrome extension to enhance your ChatGPT experience with scroll controls and search functionality
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Features</h2>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Scroll to top/bottom with one click
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Search within long conversations
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Highlight search results with navigation
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Responsive design for all screen sizes
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Dark mode support
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Keyboard shortcuts
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Installation</h2>
            <ol className="space-y-3 text-gray-600">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  1
                </span>
                Download the extension files from this project
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  2
                </span>
                Create a new folder and save the files there
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  3
                </span>
                Open Chrome → Extensions → Developer mode
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  4
                </span>
                Click "Load unpacked" and select your folder
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  5
                </span>
                Visit ChatGPT to see the extension in action
              </li>
            </ol>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Extension Files</h2>
          <p className="text-gray-600 mb-4">This project contains three essential files for the Chrome extension:</p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">manifest.json</h3>
              <p className="text-sm text-gray-600">Extension configuration and permissions</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">content.js</h3>
              <p className="text-sm text-gray-600">Main functionality and event handlers</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">styles.css</h3>
              <p className="text-sm text-gray-600">UI styling and responsive design</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-3">Keyboard Shortcuts</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">Ctrl + Home</kbd>
              <span className="ml-2 text-blue-700">Scroll to top</span>
            </div>
            <div>
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">Ctrl + End</kbd>
              <span className="ml-2 text-blue-700">Scroll to bottom</span>
            </div>
            <div>
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">Ctrl + Shift + F</kbd>
              <span className="ml-2 text-blue-700">Focus search</span>
            </div>
            <div>
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">F3</kbd>
              <span className="ml-2 text-blue-700">Next search result</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
