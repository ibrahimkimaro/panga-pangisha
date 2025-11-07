from sqladmin import ModelView
from models.Admin_user import AdminUser
from models.users import User
from models.houses import Property

class AdminUserAdmin(ModelView, model=AdminUser):
    column_list = [AdminUser.id, AdminUser.username]
    can_create = True
    can_edit = True
    can_delete = True

class UserAdmin(ModelView, model=User):
    column_list = [User.id, User.fullname, User.email, User.phone, User.role, User.created_at]
    can_create = True
    can_edit = True
    can_delete = True


class HouseAdmin(ModelView,model=Property):
    column_list = [Property.id,Property.property_name,Property.house_number,Property.contact_email]
    can_create = True
    can_edit = True
    can_delete = True