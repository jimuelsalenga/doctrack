const Stats = () => {
  const statData = [
    { label: "Active Requests", count: 12, status: "LIVE", color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Ready for Pickup", count: "03", status: "READY", color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Total Completed", count: "1,284", status: "SUCCESS", color: "text-slate-600", bg: "bg-slate-50" }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      {statData.map((stat, i) => (
        <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
          <p className="text-slate-500 font-semibold text-sm mb-1">{stat.label}</p>
          <h3 className="text-4xl font-black text-slate-900">{stat.count}</h3>
          <span className={`absolute top-4 right-4 text-[10px] font-bold px-2 py-1 rounded-md ${stat.bg} ${stat.color}`}>
            {stat.status}
          </span>
        </div>
      ))}
    </div>
  );
};

export default Stats;