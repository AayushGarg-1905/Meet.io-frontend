import React from 'react'

const MeetStartLoading = () => {
  return (
    <div className="h-screen w-full flex flex-col justify-center items-center bg-black">
      <p className="text-xl font-semibold mb-4">Starting your Meet...</p>
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
}

export default MeetStartLoading
