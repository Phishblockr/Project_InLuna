import React, { useState } from 'react'

const Faqs = () => {
    const faqs = [
        {
            question: "What is Lorem Ipsum?",
            answer: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. It has been the industry's standard dummy text since the 1500s.",
        },
        {
            question: "Why do we use it?",
            answer: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.",
        },
        {
            question: "Where does it come from?",
            answer: "Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in classical Latin literature.",
        },
        {
            question: "Where can I get some?",
            answer: "There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form.",
        },
    ];

    const [openIndex, setOpenIndex] = useState(null);

    const toggleFaq = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };
    return (
        <div className="z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] min-h-[calc(100svh-65px)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-4  dark:text-[#f4f4f4]">
            <h2 className="text-2xl font-bold text-center mb-8 ">Frequently Asked Questions</h2>
            <div className="space-y-4">
                {faqs.map((faq, index) => (
                    <div key={index} className=" rounded-lg shadow-sm">
                        <button
                            onClick={() => toggleFaq(index)}
                            className="w-full p-4 text-left font-medium bg-gray-200 dark:bg-[#001C40] rounded-lg focus:outline-none"
                        >
                            {faq.question}
                            <span className={`float-right ${openIndex === index ? "transform rotate-180" : ""}`}>
                                v
                            </span>
                        </button>
                        {openIndex === index && (
                            <div className="p-4 text-gray-700 bg-[#fff] dark:bg-[#002451] dark:text-[#f4f4f4] rounded-b-lg">
                                {faq.answer}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Faqs