"use client";

export default function ListItem({ name }: { name: string }) {
    return (
        <li className="flex justify-between items-center py-2 px-4 cursor-pointer hover:bg-green-100 rounded-lg">
            <span>{name}</span>
            {/* 必要に応じて編集ボタンなどを追加 */}
            <button className="text-green-600">編集</button>
        </li>
    );
}
