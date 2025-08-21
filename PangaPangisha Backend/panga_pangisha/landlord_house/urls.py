from django.urls import path
from . import views


urlpatterns = [
    path('add_nyumba/',views.AddNyumbaView.as_view(),name="ADD HOUSE"),
    path('getAllHouses/',views.GetAllNyumbaView.as_view(),name="listi ya nyumba zote"),
    path('getAvailableHouse/',views.GetAvailableHouses.as_view(),name="list of available houses"),
    # path('specific/<int:house_id>/',views.get_specific_house.as_view(),name="Specific house"),
    # path('UserHoues/<int:user_id>/',views.get_user_houses.as_view(),name="Nyumba za Mwenye Nyumba"),
    # path(f'house_profile_image/<int:house_id>/',views.UpdateHouseProfileImageAPIView.as_view(),name="Vyumba kwa nyumba flani"),
    path(f'search_house/',views.HouseSearch.as_view(),name="Search HOUSES"),
]