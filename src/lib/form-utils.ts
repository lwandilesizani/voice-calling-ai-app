import { useState } from 'react';

/**
 * A simplified version of react-hook-form's useForm hook
 */
export function useForm(options: any = {}) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, any>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const setValue = (name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (onSubmit: (values: any) => void) => {
    return (e: React.FormEvent) => {
      e.preventDefault();
      
      // Validate if resolver is provided
      if (options.resolver) {
        try {
          const result = options.resolver.validate(values);
          if (result.success) {
            onSubmit(values);
          } else {
            // Set errors from validation
            const formattedErrors: Record<string, any> = {};
            result.errors.forEach((error: any) => {
              formattedErrors[error.path] = { message: error.message };
            });
            setErrors(formattedErrors);
          }
        } catch (error) {
          console.error('Validation error:', error);
        }
      } else {
        // No validation, just submit
        onSubmit(values);
      }
    };
  };

  const register = (name: string) => {
    return {
      name,
      onChange: (e: any) => {
        const value = e.target?.value;
        setValue(name, value);
      },
      onBlur: () => {
        setTouched((prev) => ({ ...prev, [name]: true }));
      },
      value: values[name] || '',
    };
  };

  const control = {
    _formValues: values,
    _formState: { errors },
  };

  const reset = (newValues: Record<string, any> = {}) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
  };

  const formState = {
    errors,
    isSubmitting: false,
    isValid: Object.keys(errors).length === 0,
    isDirty: Object.keys(touched).length > 0,
  };

  return {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState,
    getValues: () => values,
    watch: (name?: string) => (name ? values[name] : values),
  };
}

/**
 * A simplified version of react-hook-form's Controller component
 */
export function Controller({ name, control, render }: any) {
  const value = control._formValues[name];
  const error = control._formState.errors[name];
  
  const field = {
    value,
    onChange: (newValue: any) => {
      // Handle both direct values and event objects
      const valueToSet = newValue && newValue.target ? newValue.target.value : newValue;
      control._formValues[name] = valueToSet;
    },
    onBlur: () => {},
    name,
  };
  
  return render({ field, fieldState: { error } });
}

/**
 * A simplified version of react-hook-form's FormProvider component
 */
export function FormProvider({ children, ...methods }: any) {
  return children;
}

/**
 * A simplified version of zod resolver
 */
export const zodResolver = (schema: any) => {
  return {
    validate: (values: any) => {
      try {
        schema.parse(values);
        return { success: true, values };
      } catch (error: any) {
        return {
          success: false,
          errors: error.errors || [{ path: 'form', message: 'Validation failed' }],
        };
      }
    },
  };
}; 