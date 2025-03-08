import React from 'react';

interface TextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  cols?: number;
}

const TextArea: React.FC<TextAreaProps> = ({
  label,
  value,
  onChange,
  placeholder = '',
  rows = 4,
  cols = 50,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    console.log('Textarea Value:', event.target.value);
    onChange(event.target.value);    
  };

  return (
    <div className="flex flex-col w-full space-y-2 my-4"> {/* Use flex-col for vertical alignment and space-y-2 for spacing */}
      <label htmlFor="textarea" className="font-semibold text-left">{label}</label>
      
      <textarea
        id="textarea"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        cols={cols}
        // className="border border-gray-300 focus:ring-blue-500 focus:border-blue-500 p-2 rounded-md" // Optional Tailwind styling for the textarea
        className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
      />
    </div>
  );
};

export default TextArea;
