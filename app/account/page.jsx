import React from 'react'

export default function page() {
  return (
    <div className='h-screen bg-white flex flex-col gap-4 p-5'>
      <h1 className='text-black font-bold text-4xl'>Account Page</h1>
      <div className='flex'>
        <div className='flex-1 flex gap-3 flex-col'>
          <img src='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQa4xjShh4ynJbrgYrW_aB4lhKSxeMzQ3cO_A&s' className='h-[400px] w-[400px] object-cover' />
          <div className='flex gap-3'>
          <button className='bg-[#0364BD] p-2 px-4 rounded-lg text-2xl w-max'>upload new photo</button>
          <button className='bg-[#0364BD] p-2 px-4 rounded-lg text-2xl w-max'>delete photo</button>
          </div>
        </div>
        <div className='flex-[2] flex flex-col gap-4 bg-gray-100 rounded-lg p-4 h-full'>
          <div className='flex justify-start gap-3 items-center w-full'>
            <label className='text-2xl text-black'>Name </label>
            <input type="text" placeholder='john doe' className='text-black w-full text-2xl border-2 focus:outline-none border-gray-200 rounded-lg p-2 px-4' />
          </div>
          <div className='flex justify-start gap-3 items-center w-full'>
            <label className='text-2xl text-black'>Username </label>
            <input type="text" placeholder='johndoe123' className='text-black w-full focus:outline-none text-2xl border-2 border-gray-200 rounded-lg p-2 px-4' />
          </div>
          <div className='flex justify-start gap-3 items-center w-full'>
            <label className='text-2xl text-black'>Email </label>
            <input type="text" placeholder='johndoe@example.com' className='text-black focus:outline-none w-full text-2xl border-2 border-gray-200 rounded-lg p-2 px-4' />
          </div>
          <div className='flex justify-start gap-3 items-center w-full'>
            <label className='text-2xl text-black'>Department </label>
            <input type="text" placeholder='IT Software' disabled className='text-black placeholder:text-black focus:outline-none w-max text-2xl border-2 border-gray-200 rounded-lg p-2 px-4' />
          </div>
        </div>
      </div>
    </div>
  )
}
