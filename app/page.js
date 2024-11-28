import React from 'react';
import MailCard from './components/MailCard';
import Link from 'next/link';

export default function Page() {
  const emails = [
    {
      from: "phisher@example.com",
      subject: "Urgent: Update Your Bank Info",
      body: `
        <div class="email-container">
          <p>Dear User,</p>
          <p>We received a request to update your bank details: <strong>[Your Email Address]</strong>.</p>
          <p>If you made this request, you can update your details by following the instructions below:</p>
          <p><strong>Update Your Details:</strong></p>
          <p>Click the link below to update your bank details: <a href="#">Update Bank Details</a></p>
        </div>
      `,
      time: "2024-11-27",
      id: "email-001",
      to: "alice@example.com",
    },
    {
      from: "safe@shopping.com",
      subject: "Your Receipt for Order #12345",
      body: "Thank you for your purchase. Your order is on its way!",
      time: "2024-11-26",
      id: "email-002",
      to: "alice@example.com",
    },
    // More emails here...
  ];

  return (
    <div className='w-full bg-white h-screen flex gap-4 flex-col p-4'>
      <div className='flex justify-between gap-3 items-center'>
        <div className='flex justify-start items-center gap-3'>
          <h1 className='text-black text-4xl font-bold'>Inbox</h1>
          <div>
            <input type='text' className='border-2 text-black border-gray-200 text-3xl p-2 px-4 rounded-xl focus:outline-none' placeholder='enter text to search' />
          </div>
        </div>
        <div>
          <Link href={'/account'}>
            <img src='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQa4xjShh4ynJbrgYrW_aB4lhKSxeMzQ3cO_A&s' className='h-[100px] w-[100px] object-cover rounded-full' />
          </Link>
        </div>
      </div>
      <div className='flex flex-col w-full gap-3 overflow-y-scroll'>
        {emails.map(el => (
          <MailCard 
            key={el.id} 
            time={el.time} 
            from={el.from} 
            body={el.body} 
            subject={el.subject} 
            id={el.id} 
          />
        ))}
      </div>
      <div className='w-full justify-between items-center flex'>
        <button className='bg-gray-100 text-black p-2 px-4 text-2xl rounded-lg'>previous</button>
        <button className='bg-gray-100 text-black p-2 px-4 text-2xl rounded-lg'>next</button>
      </div>
    </div>
  );
}
