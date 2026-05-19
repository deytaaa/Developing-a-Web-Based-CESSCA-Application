const Card = ({ children, className = '', title, action, contentClassName = '' }) => {
  return (
    <div className={`group bg-white/95 backdrop-blur rounded-2xl border border-gray-200 shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(15,23,42,0.12)] ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-200/80 bg-gradient-to-r from-gray-50/80 to-white flex items-center justify-between rounded-t-2xl">
          <h3 className="text-lg font-semibold text-gray-900 tracking-tight">{title}</h3>
          {action && action}
        </div>
      )}
      <div className={`p-6 ${contentClassName}`}>{children}</div>
    </div>
  );
};

export default Card;
