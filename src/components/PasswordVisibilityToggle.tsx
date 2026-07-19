'use client'

interface PasswordVisibilityToggleProps {
  visible: boolean
  onToggle: () => void
  labelVisible: string
  labelHidden: string
}

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
      <path
        d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12 18 18.75 12 18.75 2.25 12 2.25 12Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
      <path
        d="M3.98 8.223A19.817 19.817 0 0 0 2.25 12s3.75 6.75 9.75 6.75c1.348 0 2.574-.232 3.681-.617M6.228 6.228C8.008 5.089 9.955 4.5 12 4.5c6 0 9.75 7.5 9.75 7.5a20.317 20.317 0 0 1-4.138 5.05M9.879 9.879a3 3 0 0 0 4.242 4.242"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function PasswordVisibilityToggle({
  visible,
  onToggle,
  labelVisible,
  labelHidden,
}: PasswordVisibilityToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute inset-y-0 right-0 m-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:text-gray-700"
      aria-label={visible ? labelVisible : labelHidden}
      aria-pressed={visible}
      title={visible ? labelVisible : labelHidden}
    >
      {visible ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  )
}
