from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from ..models import HireBlockedDate
from ..serializers.hire_blocked_date_serializer import HireBlockedDateSerializer
from rest_framework.permissions import IsAdminUser


class AdminHireBlockedDateListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        blocked = HireBlockedDate.objects.select_related('motorcycle').all()
        return Response(HireBlockedDateSerializer(blocked, many=True).data)

    def post(self, request):
        serializer = HireBlockedDateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminHireBlockedDateDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get_object(self, pk):
        try:
            return HireBlockedDate.objects.select_related('motorcycle').get(pk=pk)
        except HireBlockedDate.DoesNotExist:
            return None

    def patch(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = HireBlockedDateSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
