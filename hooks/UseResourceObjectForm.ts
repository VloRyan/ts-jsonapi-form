import { ResourceObjectForm } from "../form/ResourceObjectForm.tsx";
import { ResourceObject } from "../jsonapi/model/Objects.ts";
import type { QueryKey } from "@tanstack/query-core";
import { useQueryClient } from "@tanstack/react-query";

export interface SubmitResponseHandler {
  onSubmitSuccess: (object: ResourceObject) => void;
  onSubmitError: (error: Error) => void;
}
export interface useResourceObjectFormProps {
  object: ResourceObject | null;
  id?: string;
  onSubmit?: (object: ResourceObject) => void;
  queryKey?: QueryKey;
  submitResponseHandler?: SubmitResponseHandler;
}

export const useResourceObjectForm = (props: useResourceObjectFormProps) => {
  const queryClient = useQueryClient();

  return new ResourceObjectForm({
    ...props,
    queryClient: queryClient,
    onSubmitSuccess: (obj: ResourceObject) => {
      if (props.submitResponseHandler) {
        props.submitResponseHandler.onSubmitSuccess(obj);
      }
    },
  });
};
