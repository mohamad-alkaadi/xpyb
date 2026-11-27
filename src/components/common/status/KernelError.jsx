import { useKernel } from '../../../context/KernelContext.jsx';

const KernelError = () => {
  const { error } = useKernel();

  if (!error) return null;

  return (
    <p role="alert" className="min-w-0 break-words text-red-600 dark:text-red-400">
      {error}
    </p>
  );
};

export default KernelError;
