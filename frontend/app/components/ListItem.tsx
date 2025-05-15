"use client";

import type { MouseEventHandler, ReactNode } from "react";

interface ListItemProps {
    main: ReactNode;
    sub?: string;
    className?: string;
    onClick?: MouseEventHandler<HTMLLIElement>;
    rightElement?: ReactNode;
    onRightClick?: MouseEventHandler<HTMLButtonElement>;
}

export default function ListItem({
    main,
    sub,
    className = "flex justify-between items-center py-2 px-4 cursor-pointer hover:bg-green-100 rounded-lg",
    onClick,
    rightElement,
    onRightClick
}: ListItemProps) {
    return (
        <li
            className={className}
            onClick={onClick}
        >
            <div className="flex-1 flex flex-col items-start">
                <span className="text-lg">{main}</span>
                <span className="text-base">{sub}</span>
            </div>
            <button
                className="w-[25%] text-green-600 flex justify-center items-center"
                onClick={(e) => {
                    e.stopPropagation(); // ← liのonClickを止める（重要）
                    onRightClick?.(e);
                }}
            >
                {rightElement}
            </button>
        </li>
    );
}
