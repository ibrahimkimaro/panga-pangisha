from rest_framework.permissions import BasePermission

class IsLandlord(BasePermission):
    """
    Allows access only to users in the 'landlord' group.
    """
    def has_permission(self, request, view):
        user = request.user
        return (
            user and
            user.is_authenticated and
            user.groups.filter(name='landlord').exists()
        )
    
class IsRenter(BasePermission):
     def has_permission(self, request, view):
        user = request.user
        return (
            user and
            user.is_authenticated and
            user.groups.filter(name='renter').exists()
        )
