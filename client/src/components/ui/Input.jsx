import { cn } from '../../utils/cn';

export const Input = ({ className, ...props }) => {
  return (
    <input
      className={cn(
        'w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 bg-white text-gray-900',
        className
      )}
      {...props}
    />
  );
};
