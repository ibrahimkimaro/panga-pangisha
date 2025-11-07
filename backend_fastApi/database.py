from sqlmodel import SQLModel, create_engine, Session

DATABASE_URL = "postgresql+psycopg2://ibrahim:kimmy123@localhost:5432/panga_pangisha_db"

engine = create_engine(DATABASE_URL, echo=True)

def create_db_and_tables():
    from models.Admin_user import AdminUser
    from models.users import User
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
