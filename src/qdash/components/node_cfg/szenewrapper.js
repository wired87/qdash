import { Button } from "@heroui/react";
import { useCallback, useState } from "react";

const SceneWrapper = ({ nodes, edges, onNodeClick, env_id }) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleModal = useCallback(() => setIsOpen(prev => !prev), []);

  return (
    <>
      <Button
        onPress={toggleModal}
        color="primary"
        style={{
          width: "10vh",
          height: 100,
          zIndex: 9999,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        Show Graph
      </Button>


    </>
  );
};

export default SceneWrapper;
