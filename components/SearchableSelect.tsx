import React from 'react';
import Select, { Props as SelectProps } from 'react-select';

interface Option {
  value: string | number;
  label: string;
}

interface SearchableSelectProps extends Omit<SelectProps<Option, false>, 'onChange' | 'value'> {
  value: string | number;
  onChange: (value: any) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'ค้นหา...',
  className = '',
  ...props
}) => {
  const selectedOption = options.find(opt => opt.value === value) || null;
  const [isTouchDevice, setIsTouchDevice] = React.useState(false);

  React.useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice(window.matchMedia("(pointer: coarse)").matches);
    };
    checkTouch();
    // Also check on resize in case of orientation changes or device emulation
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  return (
    <Select
      value={selectedOption}
      onChange={(option) => onChange(option ? option.value : '')}
      options={options}
      placeholder={placeholder}
      className={`mt-1 block w-full ${className}`}
      classNamePrefix="react-select"
      isClearable={false}
      isSearchable={!isTouchDevice}
      blurInputOnSelect={true}
      openMenuOnFocus={true}
      tabSelectsValue={false}
      menuShouldScrollIntoView={false}
      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
      menuPosition="fixed"
      menuPlacement="auto"
      maxMenuHeight={450}
      styles={{
        control: (base) => ({
          ...base,
          borderColor: '#D1D5DB', // gray-300
          '&:hover': {
            borderColor: '#3B82F6', // blue-500
          },
          boxShadow: 'none',
          borderRadius: '0.375rem', // rounded-md
          padding: '2px',
        }),
        menu: (base) => ({
          ...base,
          zIndex: 9999,
        }),
        menuPortal: (base) => ({
          ...base,
          zIndex: 9999,
        }),
      }}
      {...props}
    />
  );
};

export default SearchableSelect;
