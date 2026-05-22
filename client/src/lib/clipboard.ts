export const copyToClipboard = async (text: string): Promise<void> => {
  if (!navigator.clipboard) {
    throw new Error('Clipboard is not available in this browser');
  }

  await navigator.clipboard.writeText(text);
};
