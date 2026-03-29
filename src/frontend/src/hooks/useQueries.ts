import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Message } from "../backend.d";
import { useActor } from "./useActor";

export function useChatHistory() {
  const { actor, isFetching } = useActor();
  return useQuery<Message[]>({
    queryKey: ["chatHistory"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getChatHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSupportedLanguages() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["supportedLanguages"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSupportedLanguages();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAskQuestion() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      question,
      language,
    }: { question: string; language: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.askQuestion(question, language);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatHistory"] });
    },
  });
}

export function useClearHistory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.clearHistory();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatHistory"] });
    },
  });
}
