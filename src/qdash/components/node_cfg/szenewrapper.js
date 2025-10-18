import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { useCallback, useState } from "react";
import { ThreeScene } from "../../_use_three";

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

      <Modal isOpen={isOpen} onClose={toggleModal} size="5xl" scrollBehavior="inside">
        <ModalContent>
            <>
              <ModalHeader className="flex flex-col gap-1">Graph View</ModalHeader>
              <ModalBody>
                <div style={{ width: "100%", height: "60vh", position: "relative" }}>
                  <ThreeScene nodes={nodes} edges={edges} onNodeClick={onNodeClick} env_id={env_id} />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={toggleModal}>
                  Close
                </Button>
              </ModalFooter>
            </>

        </ModalContent>
      </Modal>
    </>
  );
};

export default SceneWrapper;
