import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { PlusCircle, Layers } from 'lucide-react';

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#F3F4F6] text-[#1F2937] font-sans flex flex-col overflow-hidden">
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-8 shrink-0 shadow-sm">
        <div className="flex items-center gap-3 md:w-48">
        </div>
        <nav className="flex bg-gray-100 p-1 rounded-xl">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
                isActive
                  ? 'bg-white shadow-sm text-gray-900 border border-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`
            }
          >
            WORKSHOP
          </NavLink>
          <NavLink
            to="/play"
            className={({ isActive }) =>
              `px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
                isActive
                  ? 'bg-white shadow-sm text-gray-900 border border-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`
            }
          >
            PLAYROOM
          </NavLink>
        </nav>
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Card Bank</p>
            <p className="text-lg font-mono font-bold leading-none">Custom</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
