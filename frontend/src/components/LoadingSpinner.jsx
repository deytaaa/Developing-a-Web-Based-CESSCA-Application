const LoadingSpinner = ({ size = 'md', centered = false }) => {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  const spinner = (
    <div className={`animate-spin rounded-full border-b-2 border-primary-600 ${sizes[size]}`}></div>
  );

  if (centered) {
    return (
      <div className="flex items-center justify-center h-full">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
