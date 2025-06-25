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
    <div className='mt-2'>
        <button className='bg-blue-600 text-black rounded-2xl size-1/5 disabled:bg-blue-200' disabled={user && user.user===null} onClick={handleStartMeet}>Start an instant meet</button>
        {user && user.user===null ?
        <div className='mt-3'>
            <p>Please SignIn to start the meet</p>
            <div className='bg-blue-600 size-1/12 text-black rounded-2xl'>
                <SignInButton/>
            </div>
            
        </div>
        :null}
    </div>
  )
}

export default InstantMeet