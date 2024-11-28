import Link from 'next/link'
import React from 'react'

export default function Navbar() {
  return (
    <nav className='h-screen bg-[#0364BD] w-1/4 flex flex-col justify-between items-start p-4'>
      <div className='flex flex-col gap-10 w-full'>
        <h1 className='text-4xl font-bold'>PhishBlockr<br />Training<br />Platform</h1>
        <ul className='text-3xl w-full flex flex-col gap-4'>
          <Link className='w-full' href={'/'}><li className='p-4 px-5 w-full bg-[#003A70] text-white rounded-lg'>
            Inbox
          </li></Link>
          <Link className='w-full' href={'/account'}><li className='p-4 px-5 w-full bg-[#003A70] text-white rounded-lg'>
            Account
          </li></Link>
          <Link className='w-full' href={'/settings'}><li className='p-4 px-5 w-full bg-[#003A70] text-white rounded-lg'>
            Settings
          </li></Link>
        </ul>
      </div>
      <button className='text-2xl font-bold'>Logout</button>
    </nav>
  )
}
