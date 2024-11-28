import React from 'react';
import Link from 'next/link';

export default function MailCard({ from, subject, body, time, id }) {
  console.log(body);
  
  return (
    <Link href={{
      pathname: `/${id}`,
      query: { from, subject, time, body } // Passing query parameters
    }}>
      <div className='rounded-lg bg-gray-100 p-4 flex justify-between items-center'>
        <div className='flex gap-3 justify-center items-center'>
          <div className='h-[20px] w-[20px] rounded-full bg-[#0788FF]'></div>
          <div className='flex flex-col'>
            <h1 className='text-black text-3xl'>{from}</h1>
            <p className='text-gray-500 text-2xl'>{subject}...</p>
          </div>
        </div>
        <div className='flex justify-center items-center gap-3'>
          <h1 className='text-xl text-black'>{time}</h1>
          <input type='checkbox' className='h-[20px] w-[20px]' />
        </div>
      </div>

      {/* This is where the actual email body (HTML) gets injected */}
      <div className="email-body" dangerouslySetInnerHTML={{ __html: body }} />
    </Link>
  );
}
