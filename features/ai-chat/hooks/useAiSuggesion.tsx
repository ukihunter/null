import { useState, useCallback } from "react";
import { text } from "stream/consumers";
import { set } from "zod";

interface AISuggestionState {
  suggestion: string | null;
  isLoading: boolean;
  position: { line: number; column: number } | null;
  decoration: string[];
  isEnabled: boolean;
}

interface UseAISuggestionReturn extends AISuggestionState {
  toggleEnabled: (value: boolean) => void;
  fetchSuggestion: (type: string, editor: any) => Promise<void>;
  acceptSuggestion: (editor: any, monaco: any) => void;
  rejectSuggestion: (editor: any) => any;
  clearSuggestion: (editor: any) => void;
}

export const useAISuggestion = (): UseAISuggestionReturn => {
  const [state, setState] = useState<AISuggestionState>({
    suggestion: null,
    isLoading: false,
    position: null,
    decoration: [],
    isEnabled: false,
  });

  const toggleEnabled = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, isEnabled: value }));
  }, []);

  const fetchSuggestion = useCallback(async (type: string, editor: any) => {
    setState((currentState) => {
      if (!currentState.isEnabled) {
        console.warn("AI suggestion is disabled.");
        return currentState;
      }
      if (!editor) {
        console.warn("Editor instance is not available.");
        return currentState;
      }
      const model = editor.getModel();
      const currentPosition = editor.getPosition();
      if (!model || !currentPosition) {
        console.warn("Editor model or cursor position is not available.");
        return currentState;
      }

      const newState = {
        ...currentState,
        isLoading: true,
      };

      (async () => {
        try {
          const payload = {
            fileContent: model.getValue(),
            cursorLine: currentPosition.lineNumber - 1,
            cursorColumn: currentPosition.column - 1,
            suggestionType: type,
          };
          const response = await fetch("/api/code-suggestion", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });
          if (!response.ok) {
            throw new Error(
              `Error fetching suggestion: ${response.statusText}`,
            );
          }
          const data = await response.json();
          if (data.suggestion) {
            const suggestionText = data.suggestion.trim();
            setState((prev) => ({
              ...prev,
              suggestion: suggestionText,
              position: {
                line: currentPosition.lineNumber,
                column: currentPosition.column,
              },
              isLoading: false,
            }));
          } else {
            console.warn("No suggestion received from the Api.");
            setState((prev) => ({
              ...prev,
              isLoading: false,
            }));
          }
        } catch (error) {
          console.error("Error fetching AI suggestion:", error);
          setState((prev) => ({
            ...prev,
            isLoading: false,
          }));
        }
      })();
      return newState;
    });
  }, []);

  const acceptSuggestion = useCallback((editor: any, monaco: any) => {
    setState((currentState) => {
      if (
        !currentState.suggestion ||
        !currentState.position ||
        !editor ||
        !monaco
      ) {
        return currentState;
      }
      const { line, column } = currentState.position;
      const sanitizedSuggestion =
        currentState.suggestion.replace(/^\d+\.\s*/g, "") ?? "";
      editor.executeEdits("", [
        {
          range: new monaco.Range(line, column, line, column),
          text: sanitizedSuggestion,
          forceMoveMarkers: true,
        },
      ]);
      return {
        ...currentState,
        suggestion: null,
        position: null,
        decoration: [],
      };
    });
  }, []);

  const clearSuggestion = useCallback((editor: any) => {
    setState((currentState) => {
      if (editor && currentState.decoration.length > 0) {
        editor.deltaDecorations(currentState.decoration, []);
      }
      return {
        ...currentState,
        suggestion: null,
        position: null,
        decoration: [],
      };
    });
  }, []);

  const rejectSuggestion = useCallback(
    (editor: any) => {
      clearSuggestion(editor);
    },
    [clearSuggestion],
  );

  return {
    ...state,
    toggleEnabled,
    fetchSuggestion,
    acceptSuggestion,
    rejectSuggestion,
    clearSuggestion,
  };
};
