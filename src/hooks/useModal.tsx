import { useState } from "react";

export interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: "info" | "success" | "error" | "warning";
}

export function useModal() {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const showModal = (
    title: string,
    message: string,
    type: "info" | "success" | "error" | "warning" = "info"
  ) => {
    setModalState({
      isOpen: true,
      title,
      message,
      type,
    });
  };

  const closeModal = () => {
    setModalState({ ...modalState, isOpen: false });
  };

  return {
    modalState,
    showModal,
    closeModal,
    setModalState,
  };
}

