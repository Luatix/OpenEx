import { Control, FieldValues, useFieldArray, UseFieldArrayAppend, UseFieldArrayRemove } from 'react-hook-form';

interface Props {
  control: Control;
  renderField: (field: Record<'id', string>, index: number, remove: UseFieldArrayRemove) => JSX.Element;
  name: string;
  renderLabel: (append: UseFieldArrayAppend<FieldValues>) => JSX.Element;
}

const FieldArray = ({ control, name, renderField, renderLabel }: Props) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  return (
    <div>
      {renderLabel(append)}
      {fields.map((field, index) => (renderField(field, index, remove)))}
    </div>
  );
};

export default FieldArray;
