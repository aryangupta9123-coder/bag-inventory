import { cn } from '../../utils/cn';

export const Card = ({ children, className, style }) => {
  return (
    <div
      className={cn('rounded-2xl p-6 transition-shadow duration-200 hover:shadow-md', className)}
      style={{
        background: '#faf7f2',
        border: '1px solid #e8dfd0',
        ...style,
      }}
    >
      {children}
    </div>
  );
};
