import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient, unwrap, type Schemas } from '../client';
import { queryKeys } from './keys';

export function useCreateTripRequest() {
  return useMutation({
    mutationFn: async (body: Schemas['CreateTripRequestBody']) =>
      unwrap(await apiClient.POST('/api/trip-requests', { body })),
  });
}

export function usePackageOptions(requestId: string) {
  return useQuery({
    queryKey: queryKeys.packages(requestId),
    queryFn: async () =>
      unwrap(
        await apiClient.GET('/api/trip-requests/{requestId}/packages', {
          params: { path: { requestId } },
        }),
      ),
  });
}
