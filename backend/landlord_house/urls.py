from django.urls import path
from . import views


urlpatterns = [
    path('add-nyumba/',views.AddHouseView.as_view(),name="ADD HOUSE"),
    path('getAllHouses/',views.MyPropertiesListView.as_view(),name="listi ya nyumba zote"),
    path('getAvailableHouse/',views.GetAvailableHouses.as_view(),name="list of available houses"),
    # path('specific/<int:house_id>/',views.get_specific_house.as_view(),name="Specific house"),
    # path('UserHoues/<int:user_id>/',views.get_user_houses.as_view(),name="Nyumba za Mwenye Nyumba"),
    # path(f'house_profile_image/<int:house_id>/',views.UpdateHouseProfileImageAPIView.as_view(),name="Vyumba kwa nyumba flani"),
    path(f'search_house/',views.HouseSearch.as_view(),name="Search HOUSES"),
    path('units/', views.UnitListView.as_view(), name='unit-list'),
    path('api/landlord/units/stats/', views.UnitStatsView.as_view(), name='unit-stats'),
    path('unit-details/<int:id>/', views.UnitDetailView.as_view(), name='unit-detail'),
    path('api/landlord/units/create/', views.CreateUnitView.as_view(), name='create-unit'),
    path('api/landlord/units/<uuid:unit_id>/add-tenant/', views.AddTenantToUnitView.as_view(), name='add-tenant'),
    
    # House URLs (for property dropdown)
    path('api/landlord/getAllHouses/', views.GetAllHousesView.as_view(), name='get-all-houses'),
    
    # Combined endpoint for unit management page
    path('unit-management-data/', views.get_unit_management_data, name='unit-management-data'),
]