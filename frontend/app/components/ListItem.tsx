"use client";

import type { MouseEventHandler } from "react";

interface ListItemProps {
    main: string;
    sub?: string;
    className?: string;
    onClick?: MouseEventHandler<HTMLLIElement>;
}

export default function ListItem({
    main = "main",
    sub,
    className = "flex justify-between items-center py-2 px-4 cursor-pointer hover:bg-green-100 rounded-lg",
    onClick,
}: ListItemProps) {
    return (
        <li
            className={className}
            onClick={onClick}
        >
            <div className="flex-1 flex flex-col items-start bg-green-600">
                <span className="text-2xl">{ main }</span>
                <span className="text-xl">{ sub }</span>
            </div>
            <button className="w-[25%] text-green-600">
                編集
            </button>
        </li>
    );
}
