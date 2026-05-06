import React from "react";
import { MdOutlineArrowBackIos, MdOutlineArrowForwardIos } from "react-icons/md";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {

    const getVisiblePages = (totalPages, currentPage) => {
        const maxVisibleAround = 6;
        const pages = [];

        if (totalPages === 1) {
            pages.push(1);
            return pages;
        }

        pages.push(1);

        if (currentPage > maxVisibleAround + 2) {
            pages.push("...");
        }

        const start = Math.max(2, currentPage - maxVisibleAround);
        const end = Math.min(totalPages - 1, currentPage + maxVisibleAround);

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (currentPage < totalPages - (maxVisibleAround + 1)) {
            pages.push("...");
        }

        pages.push(totalPages);

        return pages;
    };

    const visiblePages = getVisiblePages(totalPages, currentPage);

    return (
        <nav className="flex gap-x-1 justify-between">
            <button
                className="bg-gray-200 p-2 rounded-lg hover:bg-[#0364BD] hover:text-[#f4f4f4] flex flex-row transition dark:bg-[#001C40] dark:hover:bg-[#0364BD] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
            >
                <MdOutlineArrowBackIos className="w-6 h-6" /> Previous
            </button>
            <div className="flex gap-x-2 items-center">
                {visiblePages.map((page, index) =>
                    typeof page === "number" ? (
                        <button
                            key={index}
                            className={`rounded px-2 py-1 transition hover:bg-[#0364BD] hover:text-[#f4f4f4] dark:hover:bg-[#0364BD] ${currentPage === page
                                    ? "bg-[#0364BD] text-[#f4f4f4] dark:bg-[#0364BD]"
                                    : "bg-gray-200 dark:bg-[#001C40]"
                                }`}
                            onClick={() => onPageChange(page)}
                        >
                            {page}
                        </button>
                    ) : (
                        <span key={index} className="px-2 py-1">
                            {page}
                        </span>
                    )
                )}
            </div>
            <button
                className="bg-gray-200 p-2 rounded-lg hover:bg-[#0364BD] hover:text-[#f4f4f4] flex flex-row transition dark:bg-[#001C40] dark:hover:bg-[#0364BD] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
            >
                Next <MdOutlineArrowForwardIos className="w-6 h-6" />
            </button>
        </nav>
    );
};

export default Pagination;
