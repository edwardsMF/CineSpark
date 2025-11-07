export default function SuccessAlert({ message, onClose }) {
  if (!message) return null

  return (
    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 relative">
      <div className="flex items-center justify-between">
        <div>
          <strong className="font-bold">Éxito: </strong>
          <span className="block sm:inline">{message}</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 text-green-700 hover:text-green-900"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
