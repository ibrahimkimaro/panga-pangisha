from rest_framework.response import Response
from rest_framework.authentication import TokenAuthentication
from rest_framework import status
from rest_framework.views import APIView
from .models import House
from .serializers import HouseSerializer
from rest_framework.authtoken.models import Token
from authentications.models import User
# from .filters import HouseFilter
from rest_framework.generics import ListAPIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, permissions
from .permissions import IsLandlord,IsRenter
from .filters import HouseFilter

class AddNyumbaView(APIView):
    permission_classes = [permissions.IsAuthenticated,IsLandlord]  

    def post(self, request):
        serializer = HouseSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(owner=request.user) 
            return Response({"House": serializer.data}, status=status.HTTP_201_CREATED)
        else:
            return Response({"Error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        
class GetAllNyumbaView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        nyumba = House.objects.filter(owner=request.user)  
        serializer = HouseSerializer(nyumba, many=True)    
        return Response(serializer.data, status=status.HTTP_200_OK)


class GetAvailableHouses(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            nyumba = House.objects.filter(house_type="Apartment").all()
            serializer = HouseSerializer(nyumba,many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except House.DoesNotExist:
            return Response({"Error": "House not found"}, status=status.HTTP_404_NOT_FOUND)

class HouseSearch(ListAPIView):
    queryset = House.objects.all()
    serializer_class = HouseSerializer
    filter_backends = (DjangoFilterBackend,)
    filterset_class = HouseFilter