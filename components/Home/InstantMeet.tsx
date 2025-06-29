'use client'
import { SignInButton, useUser } from '@clerk/nextjs'
import { v4 as uuidv4 } from 'uuid';
import React from 'react'
import { redirect } from 'next/navigation';

const InstantMeet = () => {
    const user = useUser();

    const handleStartMeet = ()=>{
      const meetId = uuidv4();
      redirect(`/meet/${meetId}`);
    }
    
  return (
    <div className="flex flex-col gap-4 mt-4 w-full max-w-sm">
      <button
        className="bg-blue-600 text-white font-medium py-2 px-4 rounded-xl w-full hover:bg-blue-700 transition disabled:bg-blue-300"
        disabled={!user}
        onClick={handleStartMeet}
      >
        Start an Instant Meet
      </button>

      {!user && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm text-gray-800">
          <p className="mb-2">Please sign in to start a meet</p>
          <div className="inline-block">
            <SignInButton />
          </div>
        </div>
      )}
    </div>
  )
}

export default InstantMeet