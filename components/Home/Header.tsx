import { UserButton } from '@clerk/nextjs'
import React from 'react'

const Header = () => {

    return (
        <div className='flex justify-between mt-1.5 ml-3.5 mr-3.5'>
            <div className='font-bold text-3xl'>Meet.io</div>
            <div><UserButton /></div>
        </div>
    )
}

export default Header