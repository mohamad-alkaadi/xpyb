import { useEffect, useState } from 'react';
import { dataUrlToBlob } from '../../lib/slides/blobs.js';

const ImageOutput = ({ item }) => {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    const blob = dataUrlToBlob(item.src);
    if (!blob) return undefined;
    const created = URL.createObjectURL(blob);
    setUrl(created);
    return () => URL.revokeObjectURL(created);
  }, [item.src]);

  if (!url) return null;

  return <img alt="Cell output" className="max-h-full max-w-full self-start object-contain" src={url} />;
};

export default ImageOutput;
