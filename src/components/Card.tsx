import React from 'react';
import Link from 'next/link';

interface CardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

const Card: React.FC<CardProps> = ({ title, description, icon, href }) => {
  return (
    <Link 
      href={href}
      className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 border border-gray-200"
    >
      <div className="text-primary mb-4">
        {icon}
      </div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">{title}</h2>
      <p className="text-gray-600 text-center">{description}</p>
    </Link>
  );
};

export default Card;
