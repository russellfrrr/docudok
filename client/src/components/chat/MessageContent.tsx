import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

const TYPEWRITER_SPEED_MS = 12;

interface MessageContentProps {
  text: string;
  enabled: boolean;
  markdown?: boolean;
  onComplete?: () => void;
}

export const MessageContent = ({
  text,
  enabled,
  markdown = false,
  onComplete,
}: MessageContentProps) => {
  const [visibleLength, setVisibleLength] = useState(enabled ? 0 : text.length);
  const visibleText = enabled ? text.slice(0, visibleLength) : text;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setVisibleLength((currentLength) => {
        if (currentLength >= text.length) {
          window.clearInterval(intervalId);
          onComplete?.();
          return currentLength;
        }

        return currentLength + 1;
      });
    }, TYPEWRITER_SPEED_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [enabled, text.length, onComplete]);

  if (markdown) {
    return (
      <div className="space-y-3 text-sm leading-6 [&_ol]:ml-5 [&_ol]:list-decimal [&_p]:leading-6 [&_strong]:font-semibold [&_ul]:ml-5 [&_ul]:list-disc">
        <ReactMarkdown>{visibleText}</ReactMarkdown>
      </div>
    );
  }

  return (
    <p className="whitespace-pre-wrap text-sm leading-6">
      {visibleText}
    </p>
  );
};
