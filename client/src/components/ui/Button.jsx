import { cn } from '../../utils/cn';

const variants = {
  primary:   'bg-[#b8860b] hover:bg-[#9a7009] text-white shadow-sm hover:shadow-md',
  secondary: 'bg-[#3d2010] hover:bg-[#2c1a0e] text-[#e8c98a]',
  danger:    'bg-[#b85c38] hover:bg-[#9e4e2f] text-white shadow-sm',
  outline:   'border border-[#e8dfd0] text-[#8a6a50] hover:border-[#b8860b] hover:text-[#b8860b] bg-transparent',
  ghost:     'text-[#8a6a50] hover:bg-[#f5f0e8] bg-transparent',
};

export const Button = ({ children, variant = 'primary', className, ...props }) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold',
        'transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
        'active:scale-95',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
