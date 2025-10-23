// Toast simple pour remplacer sonner temporairement
export const toast = {
  success: (message: string) => {
    console.log("✅ Success:", message);
    // Vous pouvez implémenter votre propre système de toast ici
    alert(`Succès: ${message}`);
  },
  error: (message: string) => {
    console.error("❌ Error:", message);
    alert(`Erreur: ${message}`);
  },
  info: (message: string) => {
    console.info("ℹ️ Info:", message);
    alert(`Info: ${message}`);
  }
};
