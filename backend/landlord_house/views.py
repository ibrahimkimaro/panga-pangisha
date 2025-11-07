from datetime import timezone
from rest_framework.response import Response
from rest_framework.authentication import TokenAuthentication
from rest_framework import status
from rest_framework.views import APIView

from authentications import serializers
from .models import House
from rest_framework.authtoken.models import Token
from authentications.models import User
from .filters import HouseFilter
from rest_framework.generics import ListAPIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, permissions
from .permissions import IsLandlord,IsRenter
from .filters import HouseFilter
from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction

from .models import House, HouseImage
from .serializers import HouseSerializer
from .models import Unit  

class AddHouseView(generics.CreateAPIView):
    serializer_class = HouseSerializer
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def perform_create(self, serializer):
        user = self.request.user
        cover_image = self.request.FILES.get('cover_image')
        total_units = int(self.request.data.get('total_units', 0))

        # Save house (serializer handles amenities automatically)
        house = serializer.save(owner=user, cover_image=cover_image)

        # Save additional images
        images = self.request.FILES.getlist('images')
        for img in images:
            HouseImage.objects.create(house=house, images=img)

        # Auto-create units
        for i in range(total_units):
            Unit.objects.create(
                house=house,
                unit_number=f"U{i+1}",
                status='available'
            )

        return house


    # def create(self, request, *args, **kwargs):
    #     serializer = self.get_serializer(data=request.data)
    #     serializer.is_valid(raise_exception=True)
    #     house = self.perform_create(serializer)
    #     return Response({
    #         "message": "House created successfully with units and images.",
    #         "house": HouseSerializer(house, context={"request": request}).data
    #     }, status=status.HTTP_201_CREATED)
        
# Refactored to use ListAPIView for cleaner code
class MyPropertiesListView(generics.ListAPIView):
    """
    Returns a list of all House objects owned by the authenticated user.
    Equivalent to the original GetAllNyumbaView, but uses ListAPIView.
    """
    serializer_class = HouseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        This method ensures the queryset is filtered to only include
        Houses where the 'owner' is the currently logged-in user.
        """
        # We assume the user is authenticated due to permission_classes
        return House.objects.filter(owner=self.request.user).order_by('-created_at')


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

from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Q, Count, Sum
from .models import House, Unit, Lease
from .serializers import HouseSerializer, UnitSerializer, LeaseSerializer

class GetAllHousesView(generics.ListAPIView):
    """Get all houses for the authenticated landlord"""
    serializer_class = HouseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return House.objects.filter(owner=self.request.user).prefetch_related('units', 'images')

class UnitListView(generics.ListAPIView):
    """Get all units with filtering and search"""
    serializer_class = UnitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Unit.objects.filter(house__owner=self.request.user).select_related('house')
        
        # Apply filters
        search_query = self.request.query_params.get('search', '')
        status_filter = self.request.query_params.get('status', 'all')
        property_filter = self.request.query_params.get('property', 'all')
        
        if search_query:
            queryset = queryset.filter(
                Q(unit_number__icontains=search_query) |
                Q(house__property_name__icontains=search_query)
            )
        
        if status_filter != 'all':
            queryset = queryset.filter(status=status_filter)
        
        if property_filter != 'all':
            queryset = queryset.filter(house_id=property_filter)
        
        return queryset.order_by('house__property_name', 'unit_number')

class UnitDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete a specific unit"""
    serializer_class = UnitSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        return Unit.objects.filter(house__owner=self.request.user)

class CreateUnitView(generics.CreateAPIView):
    """Create a new unit"""
    serializer_class = UnitSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        house_id = self.request.data.get('house')
        house = House.objects.filter(id=house_id, owner=self.request.user).first()
        if not house:
            raise serializers.ValidationError({"house": "House not found or you don't have permission."})
        serializer.save(house=house)

class UnitStatsView(generics.GenericAPIView):
    """Get statistics for units"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        units = Unit.objects.filter(house__owner=request.user)
        
        total_units = units.count()
        occupied_units = units.filter(status='rented').count()
        vacant_units = units.filter(status='available').count()
        maintenance_units = units.filter(status='maintenance').count()
        
        # Calculate total monthly revenue from occupied units
        total_revenue = units.filter(
            status='rented'
        ).aggregate(
            total=Sum('monthly_rent')
        )['total'] or 0

        stats = {
            'total_units': total_units,
            'occupied_units': occupied_units,
            'vacant_units': vacant_units,
            'maintenance_units': maintenance_units,
            'total_revenue': total_revenue,
            'new_units_this_month': units.filter(
                created_at__month=timezone.now().month,
                created_at__year=timezone.now().year
            ).count()
        }
        
        return Response(stats)

class AddTenantToUnitView(generics.GenericAPIView):
    """Add a tenant to a unit (create lease)"""
    permission_classes = [IsAuthenticated]

    def post(self, request, unit_id):
        try:
            unit = Unit.objects.get(id=unit_id, house__owner=request.user)
            
            if unit.status == 'rented':
                return Response(
                    {"error": "Unit is already occupied."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            serializer = LeaseSerializer(data=request.data)
            if serializer.is_valid():
                lease = serializer.save(unit=unit, tenant=request.data.get('tenant'))
                
                # Update unit status
                unit.status = 'rented'
                unit.save()
                
                return Response({
                    "message": "Tenant added successfully",
                    "lease": LeaseSerializer(lease).data
                }, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Unit.DoesNotExist:
            return Response(
                {"error": "Unit not found."},
                status=status.HTTP_404_NOT_FOUND
            )

@api_view(['GET'])
def get_unit_management_data(request):
    """Get all data needed for unit management page"""
    if not request.user.is_authenticated:
        return Response({"error": "Authentication required"}, status=401)
    
    # Get houses
    houses = House.objects.filter(owner=request.user)
    houses_data = HouseSerializer(houses, many=True).data
    
    # Get units with filters
    units = Unit.objects.filter(house__owner=request.user).select_related('house')
    
    # Apply filters from query params
    search = request.GET.get('search', '')
    status_filter = request.GET.get('status', 'all')
    property_filter = request.GET.get('property', 'all')
    
    if search:
        units = units.filter(
            Q(unit_number__icontains=search) |
            Q(house__property_name__icontains=search)
        )
    
    if status_filter != 'all':
        units = units.filter(status=status_filter)
    
    if property_filter != 'all':
        units = units.filter(house_id=property_filter)
    
    units_data = UnitSerializer(units, many=True).data
    
    # Get stats
    total_units = units.count()
    occupied_units = units.filter(status='rented').count()
    vacant_units = units.filter(status='available').count()
    maintenance_units = units.filter(status='maintenance').count()
    total_revenue = units.filter(status='rented').aggregate(
        total=Sum('monthly_rent')
    )['total'] or 0
    
    stats = {
        'total_units': total_units,
        'occupied_units': occupied_units,
        'vacant_units': vacant_units,
        'maintenance_units': maintenance_units,
        'total_revenue': total_revenue
    }
    
    return Response({
        'houses': houses_data,
        'units': units_data,
        'stats': stats
    })
