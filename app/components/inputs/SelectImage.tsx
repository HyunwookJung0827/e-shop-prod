"use client";

import { ImageType } from "@/app/admin/add-products/AddProductForm";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface SelectImageProps {
  item?: ImageType;
  handleFileChange: (value: File) => void;
}

const SelectImage: React.FC<SelectImageProps> = ({
  item,
  handleFileChange,
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Do something with the files!
    // Once we drag and drop the image,
    // we will check if our acceptedFiles array has any files or not (length > 0)
    if (acceptedFiles.length > 0) {
      // If we have files, we will call the handleFileChange function from the SelectColor component
      // and pass the first file from the array
      // It will later be passed to our parent component (AddProductForm)
      handleFileChange(acceptedFiles[0]);
    }
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    // We will only accept image files with .jpeg and .png extensions
    accept: { "image/*": [".jpeg", ".png"] },
  });

  return (
    <div
      {...getRootProps()}
      className="
    border-2 border-slate-400 p-2 border-dashed cursor-pointer text-sm
    font-normal text-slate-400 flex items-center justify-center"
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the Image here...</p>
      ) : (
        <p>+ {item?.color} Image</p>
      )}
    </div>
  );
};

export default SelectImage;
