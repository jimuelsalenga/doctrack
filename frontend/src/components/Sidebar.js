import React from 'react';
import { LayoutDashboard, FileText, ClipboardList, BarChart3, Settings, HelpCircle } from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    { icon: <LayoutDashboard size={20}/>, label: 'Dashboard', active: true },
    { icon: <FileText size={20}/>, label: 'Documents' },
    { icon: <ClipboardList size={20}/>, label: 'Requests' },
    { icon: <BarChart3 size={20}/>, label: 'Analytics' },
    { icon: <Settings size={20}/>, label: 'Settings' },
  ];

  return (
    <div className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col p-4 fixed left-0 top-0">
      <div className="text-2xl font-bold text-blue-600 mb-10 px-4">Curator</div>
      <nav className="flex-1 space-y-2">
        {menuItems.map((item, index) => (
          <div key={index} className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition ${item.active ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </div>
        ))}
      </nav>
      <div className="text-slate-400 px-4 py-4 flex items-center gap-3 cursor-pointer hover:text-slate-600">
        <HelpCircle size={20}/> <span>Help</span>
      </div>
    </div>
  );
};

export default Sidebar;