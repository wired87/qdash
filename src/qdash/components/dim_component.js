import { Input } from "@heroui/react";

export default function XYZInput({ value, onChange }) {
  // value is { x: number, y: number, z: number }
  // onChange is a function: (newValue: {x,y,z}) => void

  const handleChange = (axis, newVal) => {
    onChange({ ...value, [axis]: newVal === "" ? "" : Number(newVal) });
  };

  return (
    <div className="flex gap-2">
      <Input
        disabled={true}
        type="number"
        label="X"
        value={value.x}
        onChange={(e) => handleChange("x", e.target.value)}
      />
      <Input
        disabled={true}
        type="number"
        label="Y"
        value={value.y}
        onChange={(e) => handleChange("y", e.target.value)}
      />
      <Input
        disabled={true}
        type="number"
        label="Z"
        value={value.z}
        onChange={(e) => handleChange("z", e.target.value)}
      />
    </div>
  );
}
