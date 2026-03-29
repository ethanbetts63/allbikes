from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework import status

from ..models import HireExtra
from ..serializers.hire_extra_serializer import HireExtraSerializer


class AdminHireExtraListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        extras = HireExtra.objects.all()
        return Response(HireExtraSerializer(extras, many=True).data)

    def post(self, request):
        serializer = HireExtraSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminHireExtraDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get_object(self, pk):
        try:
            return HireExtra.objects.get(pk=pk)
        except HireExtra.DoesNotExist:
            return None

    def get(self, request, pk):
        extra = self.get_object(pk)
        if not extra:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(HireExtraSerializer(extra).data)

    def patch(self, request, pk):
        extra = self.get_object(pk)
        if not extra:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = HireExtraSerializer(extra, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        extra = self.get_object(pk)
        if not extra:
            return Response(status=status.HTTP_404_NOT_FOUND)
        extra.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
